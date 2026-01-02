import type { FastifyRequest, FastifyReply } from 'fastify';
import { chatService } from './chat.service.js';
import type { User } from '@prisma/client';

// =====================
// Declare user on FastifyRequest
// =====================
declare module 'fastify' {
	interface FastifyRequest {
		user?: User;
	}
}

// =====================
// Chat Handlers
// =====================

async function getChatHistoryHandler(request: FastifyRequest<{ Params: { friendId: string } }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const friendId = request.params.friendId;

		if (userId === friendId) {
			return reply.code(400).send({ message: "Cannot chat with yourself" });
		}

		const friendship = await chatService.findFriendshipBetween(request.server.prisma, userId, friendId);
		if (!friendship) {
			return reply.code(403).send({ message: "You are not friends with this user" });
		}

		const messages = await chatService.getChatHistory(request.server.prisma, userId, friendId);
		return reply.code(200).send(messages);

	} catch (error: any) {
		return reply.code(500).send({ message: "Failed to get chat history" });
	}
}


// =====================
// Export Controller Object
// =====================

export const chatController = {
	getChatHistoryHandler,
};
