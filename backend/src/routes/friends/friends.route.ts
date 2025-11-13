import type { FastifyInstance } from 'fastify'
import { friendsController } from './friends.controller.js'
import { friendsSchemas } from "./friends.schema.js";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function friendsPrivateRoutes(fastify: FastifyInstance) {
	fastify.post('/', { 
		schema: { 
			body: friendsSchemas.request.sendRequest,
			response : { 201: friendsSchemas.response.sendRequest },
			tags: ['Friends'],
			description: 'Send a friendship request to another user',
			summary: 'Send a friendship request',
			security: [{ bearerAuth: [] }]
		}
	}, 
	friendsController.sendRequestHandler);
}