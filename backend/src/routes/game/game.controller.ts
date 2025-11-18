import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateGameInput, UpdateGameInput } from './game.schema.js';
import crypto from 'crypto';
import { gameService } from './game.service.js';

// =====================
// Game CRUD Handlers
// =====================

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
		const updatedGame = await gameService.updateGame(request.server.prisma, request.params.id, request.body);
		reply.code(201);
		return (updatedGame);
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to update game"});
	}
}

async function generateTokenHandler (request: FastifyRequest<{ Params: { id: string} }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const gameId = request.params.id;
		if (!gameId) {
			return reply.code(400).send({
            	message: "Missing game id"
        	});
		}
		const game = await gameService.findGameByUserId(request.server.prisma, userId, gameId)
		if (!game) {
			return reply.code(404).send({
            	message: "Game not found or unauthorized"
        	});
		}
		const token = generateGameToken();
		return await gameService.generateToken(request.server.prisma, gameId, token);
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to generate a token"});
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
	generateTokenHandler
};