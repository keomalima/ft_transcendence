import type { FastifyRequest, FastifyReply } from 'fastify';
import { chatService } from './chat.service.js';
import type { User } from '@prisma/client';
import {z} from 'zod'
import type { SendMessageInput } from './chat.schema.js';
import { sendMessageToUser } from '../websockets/chat/chat.ws.service.js';
import { gameService } from '../game/game.service.js';
import { tournamentService } from '../tournaments/tournament.service.js';
import { gameController } from '../game/game.controller.js';

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

async function getChatHistoryHandler(request: FastifyRequest<{ Params: { friendId: string }, Querystring: { limit?: string, before?: string } }>, reply: FastifyReply) {
	try {
		const userId = request.user!.id;
		const friendId = request.params.friendId;

		const limit = request.query.limit ? parseInt(request.query.limit, 10) : 30;
		const beforeId = request.query.before || null;

		if (userId === friendId) {
			return reply.code(400).send({ message: "Cannot chat with yourself" });
		}

		if (isNaN(limit) || limit < 1 || limit > 100) {
			return reply.code(400).send({ message: "Invalid limit" });
		}

		const friendship = await chatService.findFriendshipBetween(request.server.prisma, userId, friendId,);
		if (!friendship) {
			return reply.code(403).send({ message: "You are not friends with this user" });
		}

		const messages = await chatService.getChatHistory(request.server.prisma, userId, friendId, limit, beforeId);
		return reply.code(200).send(
			messages.map(m => ({
				id: m.id,
				senderId: m.senderId,
				receiverId: m.receiverId,
				content: m.content,
				sentAt: m.sentAt.toISOString(),
				messageType: m.type,
				gameId: m.gameId ?? undefined, 
			}))
		);


	} catch (error: any) {
		return reply.code(500).send({ message: "Failed to get chat history" });
	}
}

async function sendMessageHandler(request: SendMessageRequest, reply: FastifyReply) {
	try {
		const fromUserId = request.user!.id;
		let { toUserId, content, type } = request.body;

		if (!type) type = "TEXT";

		if (type !== "TEXT" && type !== "GAME_INVITE") {
			return reply.status(400).send({
				status: "error",
				reason: "Invalid message type",
				code: "UNKNOWN",
			});
		}

		if (fromUserId === toUserId) {
			return reply.status(400).send({
				status: "error",
				reason: "You cannot send messages to yourself",
				code: "SELF",
			});
		}

		const friendship = await chatService.findFriendshipBetween(request.server.prisma, fromUserId, toUserId);
		if (!friendship) {
			return reply.status(403).send({
				status: "error",
				reason: "You are not friends with this user",
				code: "NOT_FRIEND",
			});
		}

		// Check block status: if recipient blocked the sender
		// !! if block need to disable the invite game or join game button for front end
		const isBlocked = await chatService.isBlockedBy(request.server.prisma, fromUserId, toUserId);

		if (isBlocked) {
			return reply.status(403).send({
				status: "error",
				reason: "You are blocked by this user",
				code: "BLOCKED",
			});
		}

		if (type === "TEXT") {
			const message = await chatService.saveMessage(request.server.prisma, fromUserId, toUserId, content, "TEXT");

			await sendMessageToUser(request.server.prisma, toUserId, {
				type: "chat-message",
				fromUserId,
				content,
				sentAt: message.sentAt.toISOString(),
				messageType: "TEXT",
			});

			return reply.code(200).send({status: "ok", messageId: message.id, sentAt: message.sentAt.toISOString(),});
		}
		// check if can invite game
		else if (type === "GAME_INVITE") {
			const senderTournament = await tournamentService.findActiveTournamentByUserId(request.server.prisma, fromUserId);
			const senderGame = await gameService.findActiveGameByUserId(request.server.prisma, fromUserId);

			const receiverTournament = await tournamentService.findActiveTournamentByUserId(request.server.prisma, toUserId);
			const receiverGame = await gameService.findActiveGameByUserId(request.server.prisma, toUserId);

			if (senderGame || senderTournament) {
				return reply.status(400).send({
					status: "error",
					reason: "You are already in a game or tournament",
					code: "IN_GAME"
				});
			}

			if (receiverGame || receiverTournament) {
				return reply.status(400).send({
					status: "error",
					reason: "Friend is already in a game or tournament",
					code: "IN_GAME"
				});
			}
			// Both users are available — proceed to generate gameToken and invite
			const game = await gameService.createGame(request.server.prisma, {type: 'ONLINE' , scoreToWin: 5}, fromUserId);
			if (!game)
			{
				console.log("Fail to create game");
				return reply.status(400).send({
					status: "error",
					reason: "Fail to create game",
					code: "UNKNOWN",
				});
			}
	
			// let attempts = 0;
    		// const maxAttempts = 10;
			// let token;
			// while (attempts < maxAttempts) {
			// 	token = gameController.generateGameToken();
			// 	const existingGame = await gameService.findGameByToken(request.server.prisma, token);
			// 	if (!existingGame){
			// 		await gameService.generateToken(request.server.prisma, game.id, token);
			// 		break;
			// 	}
			// 	attempts++;
			// }

			// Save message to database
			const message = await chatService.saveMessage(request.server.prisma, fromUserId, toUserId, content, "GAME_INVITE", game.id);

			await sendMessageToUser(request.server.prisma, toUserId, {
				type: "chat-message",
				fromUserId,
				content,
				sentAt: message.sentAt.toISOString(),
				messageType: "GAME_INVITE",
				gameId: game.id,
			});
			return reply.code(200).send({status: "ok", messageId: message.id, sentAt: message.sentAt.toISOString(), gameId: game.id});
		}		
	} catch (error: any) {
		console.error("Error sending message:", error);
		return reply.status(500).send({
			status: "error",
			reason: "Internal server error",
			code: "UNKNOWN",
		});
	}
}

async function getFriendsWithNewMessagesHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = request.user!.id;

		const unreadFriendIds = await chatService.getFriendsWithNewMessages(request.server.prisma, userId);

		return reply.code(200).send(unreadFriendIds);
	} catch (error: any) {
		console.error("Error fetching unread friends:", error);
		return reply.status(500).send({ message: "Failed to get unread friends" });
	}
}

async function createNotificationHandler(request: FastifyRequest<{ Body: { senderId: string } }>, reply: FastifyReply) {
	try {
		const receiverId = request.user!.id;
		const senderId = request.body.senderId;

		if (receiverId === senderId) {
			return reply.status(400).send({ status: "error", reason: "Self notification not allowed" });
		}

		await chatService.createNotificationIfMissing(request.server.prisma, senderId, receiverId);

		return reply.status(200).send({ status: "ok" });
	} catch (err) {
		console.error("❌ Failed to create notification:", err);
		return reply.status(500).send({ status: "error", reason: "Internal error" });
	}
}

async function deleteNotificationHandler(request: FastifyRequest<{ Body: { senderId: string } }>, reply: FastifyReply) {
	try {
		const receiverId = request.user!.id;
		const { senderId } = request.body;

		if (!senderId) {
			return reply.status(400).send({
				status: "error",
				reason: "Missing senderId",
			});
		}

		if (receiverId === senderId) {
			return reply.status(400).send({
				status: "error",
				reason: "Cannot delete self notification",
			});
		}

		await chatService.deleteNotification(request.server.prisma, senderId, receiverId);

		return reply.status(200).send({ status: "ok" });
	} catch (err) {
		console.error("❌ Failed to delete notification:", err);
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
	getFriendsWithNewMessagesHandler,
	createNotificationHandler,
	deleteNotificationHandler,
};
