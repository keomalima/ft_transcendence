import type { FastifyInstance } from "fastify";
import { userController } from "../user/user.controller.js";
import { tournamentSchemas } from "./tournament.schema.js";
import { tournamentController } from "./tournament.controller.js";
import { z } from "zod";

export async function tournamentPrivateRoutes(fastify: FastifyInstance) {

	fastify.put('/:id/reset', {
		schema: {
			params: z.object({id: z.string()}),
			tags: ['Tournament'],
			description: 'Reset a tournament',
			summary: 'Reset a tournament',
			security: [{ cookieAuth: [] }]
		},
		handler: tournamentController.resetTournamentHandler
	})

	fastify.post('/', {
		schema: {
			body: tournamentSchemas.request.createTournament,
			response : { 201: tournamentSchemas.response.createTournament},
			tags: ['Tournament'],
			description: 'Create a new tournament',
			summary: 'Create tournament',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: tournamentController.createTournamentHandler
	})

	fastify.post('/:token/join', {
		schema: {
			params: z.object({token: z.string()}),
			response: { 200: tournamentSchemas.response.joinTournament },
			tags: ['Tournament'],
			description: 'Join an existing tournament',
			summary: 'Join a tournament',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.joinTournamentHandler
	});

	fastify.post('/:id/token', {
		schema: {
			params: z.object({id: z.string()}),
			response: { 200: tournamentSchemas.response.generateToken },
			tags: ['Tournament'],
			description: 'Generate a token for a tournament',
			summary: 'Generate token',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.generateTokenHandler
	});

	fastify.get('/current', {
		schema: {
			response: { 200: tournamentSchemas.response.currentTournament },
			tags: ['Tournament'],
			description: 'Return the id of the current pending/active game',
			summary: 'Get current game',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.getCurrentTournamentHandler
	})

	fastify.get('/:id', {
		schema: {
			params: z.object({id: z.string()}),
			response : { 200: tournamentSchemas.response.getTournament },
			tags: ['Tournament'],
			description: 'Get the tournament info',
			summary: 'Get a tournament',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: tournamentController.getTournamentHandler
	})

	fastify.put('/:id/remove', {
		schema: {
			params: z.object({id: z.string()}),
			body: tournamentSchemas.request.removePlayer, 
			tags: ['Tournament'],
			description: 'Remove a player from a pending tournament',
			summary: 'Remove player',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.removePlayerHandler
	})

	fastify.delete('/:id', {
		schema: {
			params: z.object({id: z.string()}),
			tags: ['Tournament'],
			description: 'Delete a pending tournament or quit it if user is not the creator',
			summary: 'Delete or quit pending tournament',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.deletePendingTournamentHandler
	})

	fastify.get('/:id/participant', {
		schema: {
			params: z.object({id: z.string()}),
			response: { 200: tournamentSchemas.response.getParticipantInfo },
			tags: ['Tournament'],
			description: 'Get participant info',
			summary: 'Get participant info',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.getParticipantInfoHandler
	})

	fastify.put('/:id/quit', {
		schema: {
			params: z.object({id: z.string()}),
			tags: ['Tournament'],
			description: 'Quit an active tournament',
			summary: 'Quit an active tournament',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.quitTournamentHandler
	})

	fastify.put('/:id/start', {
		schema: {
			params: z.object({id: z.string()}),
			response: { 200: tournamentSchemas.response.startTournament },
			tags: ['Tournament'],
			description: 'Start an existing tournament',
			summary: 'Start a tournament',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.startTournamentHandler
	})

	fastify.put('/:id/start-game', {
		schema: {
			params: z.object({id: z.string()}),
			response: { 200: tournamentSchemas.response.startGame },
			tags: ['Tournament'],
			description: 'Start an existing tournament game',
			summary: 'Start a tournament game',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen, 
		handler: tournamentController.startTournamentGameHandler
	})

	fastify.get('/:id/tournament-games', {
		schema: {
			params: z.object({ id: z.string()}),
			response: { 200: tournamentSchemas.response.getTournamentGames},
			tags: ['Tournament'],
			description: 'Get all tournament games',
			summary: 'Get all tournament games',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: tournamentController.getTournamentGamesHandler
	})

	fastify.post('/:id/advance-tournament', {
		schema: {
			params: z.object({ id: z.string()}),
			response: {200: tournamentSchemas.response.advanceTournament },
			tags: ['Tournament'],
			description: 'Finish tournament game',
			summary: 'Finish tournament game',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: tournamentController.advanceTournamentHandler
	})

	fastify.put('/:id/claim-victory', {
		schema: {
			params: z.object({ id: z.string()}),
			response: {200: tournamentSchemas.response.advanceTournament },
			tags: ['Tournament'],
			description: 'Claim tournament game victory',
			summary: 'Claim victory',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: tournamentController.claimVictoryHandler
	})
}