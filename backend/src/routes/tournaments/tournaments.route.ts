import type { FastifyInstance } from "fastify";
import { userController } from "../user/user.controller.js";

export async function tournamentPrivateRoutes(fastify: FastifyInstance) {
	fastify.post('/', {
			schema: {
				body: {},
				response : {},
				tags: ['Tournament'],
				description: 'Create a new tournament',
				summary: 'Create tournament',
				security: [{ bearerAuth: [] }]
			},
			preHandler: userController.updateLastSeen,
		})
}