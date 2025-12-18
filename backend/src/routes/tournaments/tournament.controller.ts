import type { FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from '@prisma/client'
import { tournamentService } from './tournament.service.js';
import type { CreateGameTournamentInput, CreateTournamentInput } from './tournament.schema.js';
import crypto from 'crypto';
import { WaintingRoomWsController } from '../websockets/gameroom/waitingroom.ws.controller.js';
import { getDefaultAutoSelectFamilyAttemptTimeout } from 'net';
import { gameService } from '../game/game.service.js';

// =====================
// Tournament CRUD Handlers
// =====================

async function createTournamentHandler (request: FastifyRequest<{ Body: CreateTournamentInput }>, reply: FastifyReply) {
	try {
		const body = request.body;
		const userId = request.user!.id;

		if (body.numberPlayers < 2 || body.numberPlayers % 2 !== 0) {
			return reply.code(400).send({
				message: "Invalid number of players"
			});
		}

		const totalRounds = Math.ceil(Math.log2(body.numberPlayers));

		const isTournamentOn = await tournamentService.findActiveTournamentByUserId(request.server.prisma, request.user!.id);
		if (isTournamentOn) {
			return reply.code(400).send({
				message: "User currently has an active tournament on"
			});
		}
		const newGame = await tournamentService.createTournament(request.server.prisma, body, userId, totalRounds);
		return reply.code(201).send(newGame);
	} catch (error: any) {
		console.log(error);
		reply.code(500).send({ message: "Failed to create tournament"});
	}
}

async function generateTokenHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		let attempts = 0;
		const maxAttempts = 10;

		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentByUserId(request.server.prisma, userId, tournamentId)
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.token) {
			return reply.code(400).send({
				message: "Tournament already has a valid token",
				token: tournament.token
			});
		}
		while (attempts < maxAttempts) {
			const token = generateTournamentToken();
			const existingTournament = await tournamentService.findTournamentByToken(request.server.prisma, token);
			if (!existingTournament){
				return await tournamentService.generateToken(request.server.prisma, tournamentId, token);
			}
			attempts++;
		}
		return reply.code(500).send({ message: "Failed to generate unique token" });
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to generate a token"});
	}
}

async function getTournamentHandler (request: FastifyRequest<{Params: { id: string }}>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentById(request.server.prisma, tournamentId);
		if (!tournament) {
			return reply.code(404).send({
            	message: "Tournament not found or unauthorized"
        	});
		}
		const response = {
			...tournament,
			isCreator: tournament.createdBy === userId,
			token: tournament.createdBy === userId ? tournament.token : null
		}
		return response;
	} catch (error:any) {
		console.log(error);
		reply.code(500).send({ message: "Failed to get tournament"});
	}
}

async function joinTournamentHandler (request: FastifyRequest<{ Params: { token: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const joinedUser = request.user!;
		const token = request.params.token;
		const tournament = await tournamentService.findTournamentByToken(request.server.prisma, token);
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found"
			});
		}
		if (tournament.status !== "REGISTRATION") {
			return reply.code(409).send({
				message: "Cannot join, tournament has already started"
			});
		}
		if (tournament.participants.length >= tournament.numberPlayers) {
			return reply.code(409).send({
				message: "Tournament is already full"
			});
		}
		for (const participant of tournament.participants) {
			if (participant.user.id === userId) {
				return reply.code(409).send({
					message: "User is already in this tournament"
				});
			}
		}

		WaintingRoomWsController.broadcasToRoom(tournament.id, {
			type: 'room_update',
			message: `${joinedUser.displayName} joined the tournament!`,
			userId,
			displayName: joinedUser.displayName,
			avatarUrl: joinedUser.avatarUrl
		})
		return  await tournamentService.joinUserToTournament(request.server.prisma, tournament.id, userId);
	} catch (error: any) {
		console.error(error);
		reply.code(500).send({ message: "Failed to join tournament"});
	}
}

async function getCurrentTournamentHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournament = await tournamentService.findActiveTournamentByUserId(request.server.prisma, userId);
		console.log(tournament);
		if (!tournament) 
			return reply.code(204).send();

		return {
			userId: tournament.userId,
			tournamentId: tournament.tournamentId,
			status: tournament.tournament.status,
			token: tournament.tournament.token,
			totalRounds: tournament.tournament.totalRounds
		}
	} catch (error:any) {
		reply.code(500).send({ message: "Failed to fetch current tournament"});
	}
}

async function removePlayerHandler (request: FastifyRequest<{ Params: { id: string}, Body: {playerId: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const playerId = request.body.playerId;

		const tournament = await tournamentService.findTournamentByUserId(request.server.prisma, userId, tournamentId);
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.status !== "REGISTRATION"){
			return reply.code(400).send({
				message: "Can not remove a player"
			});
		}

		WaintingRoomWsController.notifyPlayerRemoved(tournamentId, playerId);

		reply.code(204).send(await tournamentService.removePlayerFromTournament(request.server.prisma, tournamentId, playerId));
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to remove player from tournament"});
	}
}

async function deletePendingTournamentHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;

		const tournament = await tournamentService.findTournamentById(request.server.prisma, tournamentId);
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.status !== 'REGISTRATION') {
			return reply.code(400).send({
				message: "Can not delete tournament"
			});
		}
		if (tournament.createdBy === userId) {
			console.log('🔥 notify closed tournament (BY CREATOR)');
			WaintingRoomWsController.notifyGameClosed(tournamentId, userId);
			return reply.code(204).send(await tournamentService.deletePendingTournament(request.server.prisma, tournamentId));
		}

		console.log('🔥 notify closed tournament (BY PLAYER)');
		WaintingRoomWsController.broadcasToRoom(tournament.id, {
			type: 'room_update',
			message: `Need to update the tournament - QUIT!`,
		});
		return reply.code(204).send(await tournamentService.removePlayerFromTournament(request.server.prisma, tournamentId, userId));
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to delete tournament"});
	}
}

async function startTournamentHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentByUserId(request.server.prisma, userId, tournamentId)
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.status !== "REGISTRATION") {
			return reply.code(409).send({
				message: "Cannot start tournament, tournament has already started or finished"
			});
		}
		if (tournament.participants.length < tournament.numberPlayers) {
			return reply.code(409).send({
				message: "Tournament is not yet full"
			});
		}
		let response = await tournamentService.startTournament(request.server.prisma, tournamentId);
		WaintingRoomWsController.broadcasToRoom(tournament.id, {
			type: 'start_game',
			message: `Start tournament!`
		})
		return response;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to start tournament"});
	}
}

async function matchMakeTournamentHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentByUserId(request.server.prisma, userId, tournamentId)
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		if (tournament.status !== "READY") {
			return reply.code(409).send({
				message: "Cannot match make, tournament has already started or finished"
			});
		}
		if (tournament.participants.length < tournament.numberPlayers) {
			return reply.code(409).send({
				message: "Tournament is not yet full"
			});
		}

		await request.server.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const shuffled = [...tournament.participants];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				const temp = shuffled[i]!;
				shuffled[i] = shuffled[j]!;
				shuffled[j] = temp;
			}

			for (let i = 0; i < shuffled.length; i += 2) {
				const first = shuffled[i];
				const second = shuffled[i + 1];
				if (!first || !second) {
					throw new Error("Unexpected missing participant while pairing");
				}
				const game = await tx.game.create({ data: {
					createdBy: userId, 
					type: 'TOURNAMENT',
					scoreToWin: tournament.scoreToWin,
					tournamentId: tournament.id,
					roundNumber: 1,
					matchNumber: i/2 + 1,
				}})
				await tx.gamePlayer.createMany({
					data: [
						{ gameId: game.id, userId: first.userId },
						{ gameId: game.id, userId: second.userId }
					]
				})
			}
			await tx.tournament.update({ where: { id: tournament.id}, data: { status: 'IN_PROGRESS' }})
		});
		return tournament;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to match make tournament"});
	}
}

async function getTournamentGamesHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const tournamentId = request.params.id;
		const tournament = await tournamentService.findTournamentByParticipant(request.server.prisma, userId, tournamentId)
		if (!tournament) {
			return reply.code(404).send({
				message: "Tournament not found or unauthorized"
			});
		}
		const games = await tournamentService.findTournamentGames(request.server.prisma, tournamentId);
		return games;
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to get tournament games"});
	}
}

async function startTournamentGameHandler (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const gameId = request.params.id;
		const game = await gameService.findGameById(request.server.prisma, gameId);
		if (!game || game.status !== 'PENDING' || game.type !== 'TOURNAMENT' || !game.gameUsers.some(user => user.user.id === userId)) {
			return reply.code(404).send({
				message: "Game not found or unauthorized"
			});
		}
		const player = game.gameUsers.find(u => u.user.id === userId);
		const opponent = game.gameUsers.find(u => u.user.id !== userId);
		if (!opponent || !player) {
			return reply.code(404).send({
				message: "Game is not yet completed"
			});
		}

		if (!player.isReady) {
			await tournamentService.markPlayerReadyByGamePlayerId(request.server.prisma, player.id);
		}

		const updatedGame = await gameService.findGameById(request.server.prisma, gameId);
		const updatedOpponent = updatedGame?.gameUsers.find(u => u.user.id !== userId);

		if (updatedOpponent?.isReady) {
			await gameService.startGame(request.server.prisma, gameId);
		}
		console.log(updatedGame);
		return updatedGame;
	} catch (error: any) {
		console.log(error);
		reply.code(500).send({ message: "Failed to start tournament game"});
	}
}

// =====================
// Tournament Helpers
// =====================

function generateTournamentToken() {
	const randomBytes = crypto.randomBytes(8);
	const token = randomBytes.toString('base64url');
	return token.slice(0, 8);
}

// =====================
// Export Controller Object
// =====================

export const tournamentController = {
	// Tournament CRUD
	createTournamentHandler,
	getTournamentHandler,
	getCurrentTournamentHandler,
	generateTokenHandler,
	joinTournamentHandler,
	removePlayerHandler,
	deletePendingTournamentHandler,
	startTournamentHandler,
	matchMakeTournamentHandler,
	getTournamentGamesHandler,
	startTournamentGameHandler
};
