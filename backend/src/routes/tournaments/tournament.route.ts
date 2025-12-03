import type { FastifyInstance } from "fastify";
import { userController } from "../user/user.controller.js";
import { tournamentSchemas } from "./tournament.schema.js";
import { tournamentController } from "./tournament.controller.js";
import { z } from "zod";

export async function tournamentPrivateRoutes(fastify: FastifyInstance) {
	fastify.post('/', {
			schema: {
				body: tournamentSchemas.request.createTournament,
				response : { 201: tournamentSchemas.response.createTournament},
				tags: ['Tournament'],
				description: 'Create a new tournament',
				summary: 'Create tournament',
				security: [{ bearerAuth: [] }]
			},
			preHandler: userController.updateLastSeen,
			handler: tournamentController.createTournamentHandler
	})

	fastify.get('/:id', {
		schema: {
			params: z.object({id: z.string()}),
			response : { 200: tournamentSchemas.response.getTournament },
			tags: ['Tournament'],
			description: 'Get the tournament info',
			summary: 'Get a tournament',
			security: [{ bearerAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: tournamentController.getTournamentHandler
	})
}