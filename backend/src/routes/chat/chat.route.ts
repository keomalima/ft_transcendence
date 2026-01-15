import type { FastifyInstance } from 'fastify';
import { chatController } from './chat.controller.js';
import { chatSchemas } from './chat.schema.js';
import { userController } from '../user/user.controller.js';
import { z } from "zod";

// =====================
// Private Routes (Authentication Required)
// =====================

export async function chatPrivateRoutes(fastify: FastifyInstance) {
	fastify.get('/history/:friendId', {
		schema: {
			params: z.object({ friendId: z.string() }),
			querystring: z.object({ limit: z.string().optional(), before: z.string().optional(),}),
			response: { 200: chatSchemas.response.getChatHistory },
			tags: ['Chat'],
			description: 'Get chat history with a friend',
			summary: 'Chat history',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: chatController.getChatHistoryHandler
	});

	fastify.post('/send', {
		schema: {
			body: chatSchemas.request.sendMessage,
			response: { 200: chatSchemas.response.sendMessage },
			tags: ['Chat'],
			description: 'Send message to a friend',
			summary: 'Send chat message',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: chatController.sendMessageHandler
	});

	fastify.get('/unread', {
		schema: {
			response: { 200: z.array(z.string()) },
			tags: ['Chat'],
			description: 'Get list of friend IDs with unread messages',
			summary: 'Unread message friends',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: chatController.getFriendsWithNewMessagesHandler
	});

	fastify.post('/notify', {
		schema: {
			body: z.object({ senderId: z.string() }),
			response: { 200: z.object({ status: z.literal("ok") }) },
			tags: ['Chat'],
			description: 'Create a notification from sender to current user',
			summary: 'Create notification',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: chatController.createNotificationHandler
	});

	fastify.delete('/notify', {
		schema: {
				body: z.object({
					senderId: z.string()
				}),
				response: { 200: z.object({ status: z.literal("ok") }) },
				tags: ['Chat'],
				description: 'Delete a notification between sender and current user',
				summary: 'Delete notification',
				security: [{ cookieAuth: [] }]
			},
		preHandler: userController.updateLastSeen,
		handler: chatController.deleteNotificationHandler
	});


}
 