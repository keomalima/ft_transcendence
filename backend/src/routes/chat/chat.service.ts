import type { PrismaClient } from '@prisma/client';

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

async function getChatHistory(prisma: PrismaClient, userId: string, friendId: string) {
	return prisma.message.findMany({
		where: {
			OR: [
				{ senderId: userId, receiverId: friendId },
				{ senderId: friendId, receiverId: userId },
			],
		},
		orderBy: {
			sentAt: 'asc',
		},
	});
}



// =====================
// Export Chat Service Object
// =====================

export const chatService = {
	findFriendshipBetween,
	getChatHistory,
	
};
