import type { FastifyRequest } from "fastify";
import type { SocketStream } from "@fastify/websocket";


// Store active chat connections by userId
const chatConnections = new Map<string, SocketStream>();

export const ChatWsController = {
	async chatHandler(
		connection: SocketStream,
		request: FastifyRequest<{ Params: { userId: string } }>
	) {
		const userId = request.params.userId;
		console.log(`User ${userId} connected to chat.`);

		// Store this user's connection
		chatConnections.set(userId, connection);

		// Send connection confirmation
		connection.send(JSON.stringify({
			type: "connected",
			message: "Chat WebSocket connection established"
		}));

		// Optional: handle socket close (clean up)
		connection.on('close', () => {
			chatConnections.delete(userId);
			console.log(`User ${userId} disconnected from chat.`);
		});
	}
};
