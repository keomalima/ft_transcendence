import type { SocketStream } from "@fastify/websocket";
import type { ChatWsMessage } from "./chat.ws.types.js";

const chatConnections = new Map<string, SocketStream>();

export function registerChatConnection(userId: string, connection: SocketStream) {
	chatConnections.set(userId, connection);
}

export function removeChatConnection(userId: string) {
	chatConnections.delete(userId);
}

export function sendMessageToUser(userId: string, payload: ChatWsMessage): void {
	const connection = chatConnections.get(userId);
	if (!connection) return;

	try {
		connection.send(JSON.stringify(payload));
	} catch (err) {
		console.error(`❌ Failed to send message to user ${userId}:`, err);
	}
}
