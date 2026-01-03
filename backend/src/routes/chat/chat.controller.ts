import type { FastifyRequest, FastifyReply } from 'fastify';
import { chatService } from './chat.service.js';
import type { User } from '@prisma/client';
import {z} from 'zod'
import type { SendMessageInput } from './chat.schema.js';
import { sendMessageToUser } from '../websockets/chat/chat.ws.service.js';

// =====================
// Declare user on FastifyRequest
// =====================
declare module 'fastify' {
	interface FastifyRequest {
		user?: User;
	}
}

type SendMessageRequest = FastifyRequest<{
	body: SendMessageInput;
}>;


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

async function sendMessageHandler(request: SendMessageRequest, reply: FastifyReply) {
	try {
		const fromUserId = request.user!.id;
		const { toUserId, content } = request.body;

		if (fromUserId === toUserId) {
			return reply.status(400).send({
				status: "error",
				reason: "You cannot send messages to yourself",
			});
		}

		const friendship = await chatService.findFriendshipBetween(request.server.prisma, fromUserId, toUserId);
		if (!friendship) {
			return reply.status(403).send({
				status: "error",
				reason: "You are not friends with this user",
			});
		}

		// Check block status: if recipient blocked the sender
		const isBlocked = await chatService.isBlockedBy(request.server.prisma, fromUserId, toUserId);

		if (isBlocked) {
			return reply.status(403).send({
				status: "error",
				reason: "You are blocked by this user",
			});
		}

		// Save message to database
		const message = await chatService.saveMessage(request.server.prisma, fromUserId, toUserId, content);

		// Try to send message via WebSocket if recipient is online
		await sendMessageToUser(toUserId, {
			type: "chat-message",
			fromUserId,
			content,
			sentAt: message.sentAt.toISOString(),
		});

		return reply.code(200).send({status: "ok", messageId: message.id, sentAt: message.sentAt.toISOString(),});
	} catch (error: any) {
		console.error("Error sending message:", error);
		return reply.status(500).send({
			status: "error",
			reason: "Internal server error",
		});
	}
}


// =====================
// Export Controller Object
// =====================

export const chatController = {
	getChatHistoryHandler,
	sendMessageHandler,
};
