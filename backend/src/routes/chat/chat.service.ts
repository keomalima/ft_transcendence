import { PrismaClient } from '@prisma/client';
import type { Message } from '@prisma/client';

// =====================
// Chat Service Functions
// =====================


async function findFriendshipBetween(prisma: PrismaClient, userId: string, friendId: string) {
	return prisma.friendship.findFirst({
		where: {
			status: 'ACCEPTED',
			OR: [
				{ requesterId: userId, addresseeId: friendId },
				{ requesterId: friendId, addresseeId: userId },
			],
		},
	});
}

async function getChatHistory(prisma: PrismaClient, userId: string, friendId: string, limit: number,beforeMessageId?: string): Promise<Message[]> {

	const messages = await prisma.message.findMany({
   		where: {
      		OR: [
       			{ senderId: userId, receiverId: friendId },
        		{ senderId: friendId, receiverId: userId },
     		],
    	},
   	 	orderBy: {
    		sentAt: 'desc',
    	},
   	 	cursor: beforeMessageId ? { id: beforeMessageId } : undefined,
    	skip: beforeMessageId ? 1 : 0,
    	take: limit,
  	});

	// Reverse so frontend always gets oldest → newest
	return messages.reverse();
}

async function isBlockedBy(prisma: PrismaClient, senderId: string, receiverId: string) {
	return prisma.blockStatus.findFirst({
		where: {
			blockerId: receiverId,
			blockedId: senderId,
		},
	});
}

async function saveMessage(prisma: PrismaClient, fromUserId: string, toUserId: string, content: string, type: "TEXT" | "GAME_INVITE", gameId?: string) {
	return prisma.message.create({
		data: {
			senderId: fromUserId,
			receiverId: toUserId,
			content,
			type,
			gameId: gameId ?? null, 
		}
	});

}

async function getFriendsWithNewMessages(prisma: PrismaClient, userId: string): Promise<string[]> {
	// Step 1: Get user's last time online in live chat
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { lastLiveChatOnlineAt: true },
	});

	if (!user) return [];

	// Step 2: Find all recent messages sent to this user
	const recentMessages = await prisma.message.findMany({
		where: {
			receiverId: userId,
			sentAt: user.lastLiveChatOnlineAt
				? { gt: user.lastLiveChatOnlineAt }
				: undefined,
		},
		select: { senderId: true },
		distinct: ['senderId'],
	});

	// Step 3: Try to insert each sender into Notification table
	for (const msg of recentMessages) {
		const existing = await prisma.notification.findFirst({
			where: {
				senderId: msg.senderId,
				receiverId: userId,
			},
		});

		if (!existing) {
			await prisma.notification.create({
				data: {
					senderId: msg.senderId,
					receiverId: userId,
				},
			});
		}
	}

	// Step 4: Return all senderIds in notification table for this user
	const notifications: { senderId: string }[] = await prisma.notification.findMany({
		where: { receiverId: userId },
		select: { senderId: true },
	});

	return notifications.map(n => n.senderId);
}

async function createNotificationIfMissing(prisma: PrismaClient, senderId: string, receiverId: string): Promise<void> {
	const existing = await prisma.notification.findFirst({
		where: { senderId, receiverId }
	});

	if (!existing) {
		await prisma.notification.create({
			data: { senderId, receiverId }
		});
	}
}

async function deleteNotification(prisma: PrismaClient, senderId: string, receiverId: string): Promise<void> {
	await prisma.notification.deleteMany({
		where: {
			senderId,
			receiverId,
		},
	});
}


// =====================
// Export Chat Service Object
// =====================

export const chatService = {
	findFriendshipBetween,
	getChatHistory,
	isBlockedBy,
	saveMessage,
	getFriendsWithNewMessages,
	createNotificationIfMissing,
	deleteNotification,
};
