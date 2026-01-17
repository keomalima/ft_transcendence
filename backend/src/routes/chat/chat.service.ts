import { PrismaClient, GameStatus, MessageType } from '@prisma/client';

export type ChatHistoryMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content: string | null;
  gameId: string | null;
  gameStatus: GameStatus | null;
  sentAt: Date;
};

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

async function getChatHistory(prisma: PrismaClient, userId: string, friendId: string, limit: number, beforeMessageId?: string): Promise<ChatHistoryMessage[]> {
  const messages = await prisma.message.findMany({
	where: {
		OR: [
		{ senderId: userId, receiverId: friendId },
		{ senderId: friendId, receiverId: userId },
		],
	},
	orderBy: { sentAt: "desc" },
	cursor: beforeMessageId ? { id: beforeMessageId } : undefined,
	skip: beforeMessageId ? 1 : 0,
	take: limit,
	select: {
		id: true,
		senderId: true,
		receiverId: true,
		type: true,
		content: true,
		gameId: true,
		sentAt: true,
		game: { select: { status: true } },
	},
	});

  	const ordered = messages.reverse();

 	const out: ChatHistoryMessage[] = [];

	for (const m of ordered) {
		out.push({
			id: m.id,
			senderId: m.senderId,
			receiverId: m.receiverId,
			type: m.type,
			content: m.content ?? null,
			gameId: m.gameId ?? null,
			gameStatus: m.game ? m.game.status : null,
			sentAt: m.sentAt,
		});
	}
	return out;
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

async function findInviteForReceiver(prisma: PrismaClient, receiverId: string, gameId: string) {
	return prisma.message.findFirst({
		where: {
			type: "GAME_INVITE",
			receiverId,
			gameId,
		},
		select: {
			id: true,
			senderId: true,
		},
	});
}

async function isUserGamePlayerInGame(prisma: PrismaClient, gameId: string, userId: string): Promise<boolean> {
	const existing = await prisma.gamePlayer.findUnique({
		where: {
			gameId_userId: { gameId, userId },
		},
	});
	return !!existing;
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
	findInviteForReceiver,
	isUserGamePlayerInGame,
};
