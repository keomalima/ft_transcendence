import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateGameInput, UpdateGameInput } from './game.schema.js';
import crypto from 'crypto';
import { gameService } from './game.service.js';
import { wsController } from '../websockets/ws.controller.js';

// =====================
// Game CRUD Handlers
// =====================

async function getGameHandler (request: FastifyRequest<{ Body: UpdateGameInput, Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const gameId = request.params.id;
		const game = await gameService.findGameById(request.server.prisma, gameId);
		if (!game) {
			return reply.code(404).send({
            	message: "Game not found or unauthorized"
        	});
		}
		const response = {
			...game,
			isCreator: game.createdBy === userId,
			token: game.createdBy === userId ? game.token : null
		}
		return response;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to get game"});
	}
}

async function createGameHandler (request: FastifyRequest<{ Body: CreateGameInput }>, reply: FastifyReply) {
	try {
		const body = request.body;

		const isGameOn = await gameService.findActiveGameByUserId(request.server.prisma, request.user!.id);
		if (isGameOn) {
			return reply.code(400).send({
				message: "User currently has an active game on"
			});
		}
		const newGame = await gameService.createGame(request.server.prisma, body, request.user!.id);
		return reply.code(201).send(newGame);
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to create game"});
	}
}

async function updateGameHandler (request: FastifyRequest<{ Body: UpdateGameInput, Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const gameId = request.params.id;
		const game = await gameService.findGameByUserId(request.server.prisma, userId, gameId)
		if (!game) {
			return reply.code(404).send({
            	message: "Game not found or unauthorized"
        	});
		}
		if (game.status !== "PENDING") {
			return reply.code(400).send({
				message: "Can not update the game"
			});
		}
		const updatedGame = await gameService.updateGame(request.server.prisma, request.params.id, request.body);
		return (updatedGame);
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to update game"});
	}
}

async function generateTokenHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		let attempts = 0;
    	const maxAttempts = 10;

		const userId = request.user!.id;
		const gameId = request.params.id;
		const game = await gameService.findGameByUserId(request.server.prisma, userId, gameId)
		if (!game) {
			return reply.code(404).send({
            	message: "Game not found or unauthorized"
        	});
		}
		if (game.token) {
			return reply.code(400).send({
            	message: "Game already has a valid token",
				token: game.token
        	});
		}
		while (attempts < maxAttempts) {
			const token = generateGameToken();
			const existingGame = await gameService.findGameByToken(request.server.prisma, token);
			if (!existingGame){
				return await gameService.generateToken(request.server.prisma, gameId, token);
			}
			attempts++;
		}
		return reply.code(500).send({ message: "Failed to generate unique token" });
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to generate a token"});
	}
}

async function joinGameHandler (request: FastifyRequest<{ Params: { token: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const joinedUser = request.user!;
		const token = request.params.token;
		const game = await gameService.findGameByToken(request.server.prisma, token);
		if (!game) {
			return reply.code(404).send({
            	message: "Game not found"
        	});
		}
		if (game.status !== "PENDING") {
			return reply.code(409).send({
				message: "Cannot join, game has already started"
			});
		}
		if (game.gameUsers.length >= 2) {
			return reply.code(409).send({
				message: "Game is already full"
			});
		}
		for (const gameUser of game.gameUsers) {
			if (gameUser.user.id === userId) {
				return reply.code(409).send({
					message: "User is already in this game"
				});
			}
		}

		wsController.broadcasToRoom(game.id, {
			type: 'room_update',
			message: `${joinedUser.displayName} joined the game!`,
			userId,
			displayName: joinedUser.displayName,
			avatarUrl: joinedUser.avatarUrl
		})
		return  await gameService.joinUserToGame(request.server.prisma, game.id, userId);
	} catch (error: any) {
		console.error(error);
		reply.code(500).send({ message: "Failed to join"});
	}
}

async function startGameHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const gameId = request.params.id;
		const game = await gameService.findGameByUserId(request.server.prisma, userId, gameId)
		if (!game) {
			return reply.code(404).send({
            	message: "Game not found or unauthorized"
        	});
		}
		if (game.status !== "PENDING") {
			return reply.code(409).send({
				message: "Cannot start game, game has already started or finished"
			});
		}
		if (game.gameUsers.length < 2) {
			return reply.code(409).send({
				message: "Game is not full"
			});
		}
		return await gameService.startGame(request.server.prisma, gameId);
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to start game"});
	}
}

async function gameHistoryHandler (request: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const games = await gameService.getGamesByUserId(request.server.prisma, userId);
		const filteredGames = games.filter((gp: typeof games[0]) => gp.game.gameUsers.length === 2 
			&& gp.game.type !== "LOCAL" 
			&& (gp.game.status === "COMPLETED"
			|| gp.game.status === "ABANDONED"));
		const result = filteredGames.map((gp: typeof filteredGames[0]) => {
			const opponent = gp.game.gameUsers.find((gu: typeof result[0])  => gu.userId !== userId);
			let durationMs;
			if (gp.game.completedAt && gp.game.startedAt)
				durationMs = Math.round(new Date(gp.game.completedAt).getTime() - new Date(gp.game.startedAt).getTime()) / 60000;
			else
				durationMs = 0;
			return {
				gameId: gp.gameId,
				score: gp.score,
				isWinner: gp.isWinner, 
				duration: durationMs,
				type: gp.game.type,
				status: gp.game.status,
				date: gp.game.createdAt,
				opponent: {
					id: opponent.userId,
					avatarUrl: opponent.user.avatarUrl,
					name: opponent.user.displayName,
					score: opponent.score,
					isWinner: opponent.isWinner,
				}
			}
		})
		return reply.code(200).send(result)
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to fetch game history"});
	}
}

async function getCurrentGameHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const game = await gameService.findActiveGameByUserId(request.server.prisma, userId);
		if (!game) 
			return reply.code(204).send();

		return {
			userId: game.userId,
			gameId: game.gameId,
			type: game.game.type,
			status: game.game.status,
			token: game.game.token
		}
	} catch (error:any) {
		reply.code(500).send({ message: "Failed to fetch current game"});
	}
}

async function removePlayerHandler (request: FastifyRequest<{ Params: { id: string}, Body: {playerId: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const gameId = request.params.id;
		const playerId = request.body.playerId;

		const game = await gameService.findGameByUserId(request.server.prisma, userId, gameId);
		if (!game) {
			return reply.code(404).send({
            	message: "Game not found or unauthorized"
        	});
		}
		if (game.status !== "PENDING"){
			return reply.code(400).send({
            	message: "Can not remove a player"
        	});
		}

		wsController.notifyPlayerRemoved(gameId, playerId);

		reply.code(204).send(await gameService.removePlayerFromGame(request.server.prisma, gameId, playerId));
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to remove player from game"});
	}
}

async function deletePendingGameHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const gameId = request.params.id;

		const game = await gameService.findGameById(request.server.prisma, gameId);
		if (!game) {
			return reply.code(404).send({
            	message: "Game not found or unauthorized"
        	});
		}
		if (game.status !== 'PENDING') {
			return reply.code(400).send({
            	message: "Can not delete game"
        	});
		}
		if (game.createdBy === userId) {
			return reply.code(204).send(await gameService.deletePendingGame(request.server.prisma, gameId));
		}
		return reply.code(204).send(await gameService.removePlayerFromGame(request.server.prisma, gameId, userId));
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to delete game"});
	}
}

// =====================
// Game Helpers
// =====================

function generateGameToken() {
	const randomBytes = crypto.randomBytes(8);
	const token = randomBytes.toString('base64url');
	return token.slice(0, 8);
}

// =====================
// Export Controller Object
// =====================

export const gameController = {
	// Game CRUD
	createGameHandler,
	updateGameHandler,
	generateTokenHandler,
	getGameHandler,
	joinGameHandler,
	startGameHandler,
	gameHistoryHandler,
	getCurrentGameHandler,
	removePlayerHandler,
	deletePendingGameHandler
};