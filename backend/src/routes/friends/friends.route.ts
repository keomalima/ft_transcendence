import type { FastifyInstance } from 'fastify'
import { friendsController } from './friends.controller.js'
import { friendsSchemas } from "./friends.schema.js";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function friendsPrivateRoutes(fastify: FastifyInstance) {
	fastify.get('/', {
		schema: {
			response: { 200: friendsSchemas.response.getFriends },
			tags: ['Friends'],
			description: 'Get the list of all active friends',
			summary: 'Get friends list',
			security: [{ bearerAuth: [] }]
		}
	},
	friendsController.getFriendsHandler);

	fastify.get('/requests', {
		schema: {
			response: { 200: friendsSchemas.response.pendingRquest},
			tags: ['Friends'],
			description: 'Get all the pending friendships requests',
			summary: 'Get friendship requests',
			security: [{ bearerAuth: [] }]
		}
	},
	friendsController.getPendingRequestsHandler)

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

	fastify.put('/accept/:id', {
		schema: { 
			response : { 200: friendsSchemas.response.acceptRequest },
			tags: ['Friends'],
			description: 'Accepts a friendshipt request',
			summary: 'Accepts friendship',
			security: [{ bearerAuth: [] }]
		}
	}, 
	friendsController.acceptFriendHandler);

	fastify.put('/reject/:id', {
		schema: { 
			response : { 200: friendsSchemas.response.rejectRequest },
			tags: ['Friends'],
			description: 'Rejects a friendshipt request',
			summary: 'Rejects friendship',
			security: [{ bearerAuth: [] }]
		}
	}, friendsController.rejectFriendHandler)
}