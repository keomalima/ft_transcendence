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
		// console.log(`User ${userId} connected to chat.`);

		registerChatConnection(userId, connection);

		connection.send(JSON.stringify(payload));

		connection.on('close', () => {
			removeChatConnectionAndUpdateTime(userId, request.server.prisma);
			// console.log(`User ${userId} disconnected from chat.`);
		});
	}
};
