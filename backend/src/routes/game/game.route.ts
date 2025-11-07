import type { FastifyInstance } from "fastify";
import { gameController } from "./game.controller.js";
import { gameSchemas } from "./game.schema.js";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function gamePrivateRoutes(fastify: FastifyInstance) {
	fastify.post('/', { 
		schema: { 
			body: gameSchemas.request.createGame, 
			response : { 201: gameSchemas.response.createGame },
			tags: ['Game'],
			description: 'Create a new game',
			summary: 'Create game',
			security: [{ bearerAuth: [] }]
		}
	}, 
	gameController.createGameHandler);

	fastify.put('/:id', {
		schema: {
			body: gameSchemas.request.updateGame, 
			response : { 200: gameSchemas.response.updateGame },
			tags: ['Game'],
			description: 'Update a game',
			summary: 'Update a game',
			security: [{ bearerAuth: [] }]
		}
	},
	gameController.updateGameHandler);
}