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
			response: { 200: chatSchemas.response.getChatHistory },
			tags: ['Chat'],
			description: 'Get chat history with a friend',
			summary: 'Chat history',
			security: [{ cookieAuth: [] }]
		},
		preHandler: userController.updateLastSeen,
		handler: chatController.getChatHistoryHandler
	});
}
 