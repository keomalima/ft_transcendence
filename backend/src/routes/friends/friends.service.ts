import { PrismaClient } from "@prisma/client";
import type { FriendsRequestInput } from './friends.schema.js';

// =====================
// User CRUD Operations
// =====================

async function findUserByDisplayName(prisma: PrismaClient, displayName: string){
	return prisma.user.findUnique({
		where: { displayName }
	});
}

async function findFriendshipRequest(prisma: PrismaClient, addresseeId: string, requesterId: string){
	return prisma.friendship.findFirst({
		where: {
			OR: [
				{ requesterId: requesterId, addresseeId: addresseeId},
				{ requesterId: addresseeId, addresseeId: requesterId}
			],
			deletedAt: null
		}
	})
}

async function sendRequest(prisma: PrismaClient, requesterId: string, addresseeId: string) {
  return prisma.friendship.create({
	data: {
            requesterId,
            addresseeId,
            status: 'PENDING'
    }
  });
}

// =====================
// Export Service Object
// =====================

export const friendsService = {
  sendRequest,
  findUserByDisplayName,
  findFriendshipRequest
};