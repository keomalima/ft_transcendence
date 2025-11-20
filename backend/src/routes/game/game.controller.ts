import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateGameInput, UpdateGameInput } from './game.schema.js';
import crypto from 'crypto';
import { gameService } from './game.service.js';

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
		return  await gameService.joinUserToGame(request.server.prisma, game.id, userId);
	} catch (error: any) {
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
	startGameHandler
};