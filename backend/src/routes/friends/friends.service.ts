import { PrismaClient } from "@prisma/client";
import type { FriendsRequestInput } from './friends.schema.js';

// =====================
// User CRUD Operations
// =====================

async function findRequestById(prisma: PrismaClient, id: string) {
	return prisma.friendship.findUnique({
		where: {id}
	})
}

async function findActiveFriends(prisma: PrismaClient, id: string) {
	return prisma.friendship.findMany({
		where: {
			OR: [
				{requesterId: id},
				{addresseeId: id}
			],
			deletedAt: null,
			status: 'ACCEPTED',
		}, 
		include: {
			requester: true,
			addressee: true,
		}
	})
}

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

async function findPendingRequests(prisma: PrismaClient, id: string) {
	return prisma.friendship.findMany({
		where: {
			addresseeId: id,
			deletedAt: null,
			status: 'PENDING'
		},
		include: {
			requester: true
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

async function acceptRequest(prisma: PrismaClient, requestId: string) {
	return prisma.friendship.update({
		where: { id: requestId },
   		data: { status: 'ACCEPTED' }
	})
}

async function deleteRequest(prisma: PrismaClient, requestId: string) {
	return prisma.friendship.delete({
		where: { id: requestId }
	})
}

// =====================
// Export Service Object
// =====================

export const friendsService = {
  sendRequest,
  findUserByDisplayName,
  findFriendshipRequest,
  findActiveFriends,
  acceptRequest,
  findRequestById,
  findPendingRequests,
  deleteRequest
};