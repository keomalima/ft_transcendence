import type { SocketStream } from "@fastify/websocket";
import type { ChatWsMessage } from "./chat.ws.types.js";
import type { PrismaClient } from "@prisma/client";

const chatConnections = new Map<string, SocketStream>();

export function registerChatConnection(userId: string, connection: SocketStream) {
	chatConnections.set(userId, connection);
}

export async function removeChatConnectionAndUpdateTime(userId: string, prisma: PrismaClient) {
	if (chatConnections.has(userId)) {
		chatConnections.delete(userId);

		await prisma.user.update({
			where: { id: userId },
			data: { lastLiveChatOnlineAt: new Date() }
		});
	}	
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