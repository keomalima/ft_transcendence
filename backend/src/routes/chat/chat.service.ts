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

async function saveMessage(prisma: PrismaClient, fromUserId: string, toUserId: string, content: string, type: "TEXT" | "GAME_INVITE", gameToken?: string) {
	return prisma.message.create({
		data: {
			senderId: fromUserId,
			receiverId: toUserId,
			content,
			type,
			gameToken: gameToken ?? null, 
		}
	});

}

// async function getFriendsWithNewMessages(prisma: PrismaClient, userId: string): Promise<string[]> {
// 	const user = await prisma.user.findUnique({
// 		where: { id: userId },
// 		select: { lastLiveChatOnlineAt: true },
// 	});

// 	const whereCondition = user?.lastLiveChatOnlineAt
// 		? { receiverId: userId, sentAt: { gt: user.lastLiveChatOnlineAt } }
// 		: { receiverId: userId };

// 	const messages: { senderId: string }[]  = await prisma.message.findMany({
// 		where: whereCondition,
// 		select: { senderId: true },
// 		distinct: ['senderId'],
// 	});

// 	return messages.map(msg => msg.senderId);
// }



// =====================
// Export Chat Service Object
// =====================

export const chatService = {
	findFriendshipBetween,
	getChatHistory,
	isBlockedBy,
	saveMessage,
	// getFriendsWithNewMessages,
};
