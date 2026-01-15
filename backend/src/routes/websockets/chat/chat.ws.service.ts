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

export async function sendMessageToUser(prisma: PrismaClient, receiverId: string, payload: ChatWsMessage): Promise<void> {
	const connection = chatConnections.get(receiverId);

	if (!connection) {
		if (payload.type === "chat-message") {
			const senderId = payload.fromUserId;

			try {
				const existing = await prisma.notification.findFirst({
					where: {
						senderId,
						receiverId,
					},
				});

				if (!existing) {
					await prisma.notification.create({
						data: {
							senderId,
							receiverId,
						},
					});
				}
			} catch (err) {
				console.error(`❌ Failed to create notification for ${receiverId}:`, err);
			}
		}

		return;
	}

	try {
		connection.send(JSON.stringify(payload));
	} catch (err) {
		console.error(`❌ Failed to send message to user ${receiverId}:`, err);
	}
}
