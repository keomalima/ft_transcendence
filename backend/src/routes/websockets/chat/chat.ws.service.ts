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
