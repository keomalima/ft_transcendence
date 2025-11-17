import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateGameInput, UpdateGameInput } from './game.schema.js';
import { gameService } from './game.service.js';

// =====================
// User CRUD Handlers
// =====================

async function createGameHandler (request: FastifyRequest<{ Body: CreateGameInput }>, reply: FastifyReply) {
	try {
		const isGameOn = await gameService.findActiveGameByUserId(request.server.prisma, request.user!.id);
		if (isGameOn) {
			return reply.code(400).send({
				message: "User currently has an active game on"
			});
		}
		const newGame = await gameService.createGame(request.server.prisma, request.body, request.user!.id);
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

// =====================
// Export Controller Object
// =====================

export const gameController = {
	// Game CRUD
	createGameHandler,
	updateGameHandler
};