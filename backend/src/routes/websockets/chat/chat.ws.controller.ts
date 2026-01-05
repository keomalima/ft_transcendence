import type { FastifyRequest } from "fastify";
import type { SocketStream } from "@fastify/websocket";
import { registerChatConnection, removeChatConnectionAndUpdateTime } from "./chat.ws.service.js";
import type { ChatWsMessage } from "./chat.ws.types.js";
import { chatService } from "../../chat/chat.service.js";


const payload: ChatWsMessage = {
	type: "connected",
	message: "Chat WebSocket connection established"
};

export const ChatWsController = {
	async chatHandler(
		connection: SocketStream,
		request: FastifyRequest<{ Params: { userId: string } }>
	) {
		const userId = request.params.userId;
		console.log(`User ${userId} connected to chat.`);

		// Store this user's connection
		registerChatConnection(userId, connection);

		// 1. Send connection confirmation
		connection.send(JSON.stringify(payload));

		// 2. Check for unread messages
		const newSenders = await chatService.getFriendsWithNewMessages(request.server.prisma, userId);
		if (newSenders.length > 0) {
			connection.send(JSON.stringify({
				type: "new-messages",
				fromUserIds: newSenders,
			}));
		}

		// Optional: handle socket close (clean up)
		connection.on('close', () => {
			removeChatConnectionAndUpdateTime(userId, request.server.prisma);
			console.log(`User ${userId} disconnected from chat.`);
		});
	}
};
