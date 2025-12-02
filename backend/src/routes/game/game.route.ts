import type { FastifyInstance } from "fastify";
import { gameController } from "./game.controller.js";
import { gameSchemas } from "./game.schema.js";
import { userController } from "../user/user.controller.js";
import { z } from "zod";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function gamePrivateRoutes(fastify: FastifyInstance) {
	fastify.get('/:id', {
		schema: {
			params: z.object({id: z.string()}),
			response : { 200: gameSchemas.response.getGame },
			tags: ['Game'],
			description: 'Get the game info',
			summary: 'Get a game',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: gameController.getGameHandler
	})

	fastify.post('/', { 
		schema: { 
			body: gameSchemas.request.createGame, 
			response : { 201: gameSchemas.response.createGame },
			tags: ['Game'],
			description: 'Create a new game',
			summary: 'Create game',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: gameController.createGameHandler
	});

	fastify.put('/:id', {
		schema: {
			params: z.object({id: z.string()}),
			body: gameSchemas.request.updateGame, 
			response : { 200: gameSchemas.response.updateGame },
			tags: ['Game'],
			description: 'Update a game',
			summary: 'Update a game',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: gameController.updateGameHandler
	});

	fastify.post('/:id/token', {
		schema: {
			params: z.object({id: z.string()}),
			response: { 200: gameSchemas.response.generateToken },
			tags: ['Game'],
			description: 'Generate a token for a game',
			summary: 'Generate token',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: gameController.generateTokenHandler
	});

	fastify.post('/:token/join', {
		schema: {
			params: z.object({token: z.string()}),
			response: { 200: gameSchemas.response.joinGame },
			tags: ['Game'],
			description: 'Join an existing game',
			summary: 'Join a game',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: gameController.joinGameHandler
	})

	fastify.put('/:id/start', {
		schema: {
			params: z.object({id: z.string()}),
			response: { 200: gameSchemas.response.startGame },
			tags: ['Game'],
			description: 'Start an existing game',
			summary: 'Start a game',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: gameController.startGameHandler
	})

	fastify.get('/history', {
		schema: {
			response: { 200: gameSchemas.response.gameHistory},
			tags: ['Game'],
			description: 'Get users game history',
			summary: 'Get game history',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: gameController.gameHistoryHandler
	})

	fastify.get('/current', {
		schema: {
			response: { 200: gameSchemas.response.currentGame },
			tags: ['Game'],
			description: 'Return the id of the current pending/active game',
			summary: 'Get current game',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: gameController.getCurrentGameHandler
	})
}

// PUT    /games/:id/finish           → terminer (scores, winner)
// 	Payload :
// 	scores
// 	winners
// 	Backend :
// 	met game.state = FINISHED
// 	met winners = true dans Game_Players
// 	durée + stats
// 	met a jour historique

// DELETE /games/:id                  → annuler si WAITING et creator
// 	Seulement si :
// 	game.state === “WAITING”
// 	user === creator
// 	Dans la pratique :
// 	Online matches : ok
// 	Tournament matches : should NEVER be deletable