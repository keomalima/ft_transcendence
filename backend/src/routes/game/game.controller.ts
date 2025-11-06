import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateGameInput } from './game.schema.js';
import { gameService } from './game.service.js';

// =====================
// User CRUD Handlers
// =====================

async function createGameHandler (request: FastifyRequest<{ Body: CreateGameInput }>, reply: FastifyReply) {
	try {
		const newGame = await gameService.createGame(request.server.prisma, request.body, request.user!.id);
		reply.code(201);
		return (newGame);
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to create game"});
	}
}

// =====================
// Export Controller Object
// =====================

export const gameController = {
	// Game CRUD
	createGameHandler
};