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
			AND: [
				{
					OR: [
						{ requesterId: id },
						{ addresseeId: id }
					]
				},
				{ deletedAt: null },
				{
					status: { 
						equals: 'ACCEPTED' 
					}

				}
			]
		},
		include: {
			requester: true,
			addressee: true,
		}
	})
}


async function findUserByDisplayName(prisma: PrismaClient, displayName: string){
	return prisma.user.findUnique({
		where: { displayName },
		select: {
			id: true,
			email: true,
			name: true,
			displayName: true,
			isOnline: true,
			avatarUrl: true
		}
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
	// 1. Fetch friendship, robust check for db
	const friendship = await prisma.friendship.findUnique({
		where: { id: requestId }
	});

	if (!friendship) {
		return null;
	}

	const { requesterId, addresseeId } = friendship;

	// 2. Clear block status both directions
	await prisma.blockStatus.deleteMany({
		where: {
			OR: [
				{ blockerId: requesterId, blockedId: addresseeId },
				{ blockerId: addresseeId, blockedId: requesterId }
			]
		}
	});

	// 3. Delete friendship
	return prisma.friendship.delete({
		where: { id: requestId }
	});
}



async function blockFriend(prisma: PrismaClient, blockerId: string, blockedId: string) {
	const existing = await prisma.blockStatus.findFirst({
		where: { 
			blockerId, 
			blockedId 
		}
	});
	if (existing) return null;

	return prisma.blockStatus.create({
		data: { blockerId, blockedId }
	});
}

async function unblockFriend(prisma: PrismaClient, blockerId: string, blockedId: string) {
	const existing = await prisma.blockStatus.findFirst({
		where: { 
			blockerId, 
			blockedId 
		}
	});
	if (!existing) return false;

	await prisma.blockStatus.delete({
		where: { id: existing.id }
	});
	return true;
}

async function findMyBlockedUsers(prisma: PrismaClient, myId: string) {
	return prisma.blockStatus.findMany({
		where: { blockerId: myId },
		select: { blockedId: true }
	});
}

async function findUsersWhoBlockedMe(prisma: PrismaClient, myId: string) {
	return prisma.blockStatus.findMany({
		where: { blockedId: myId },
		select: { blockerId: true }
	});
}

async function findFriendshipByFriendId(prisma: PrismaClient, userId: string, friendId: string) {
	return prisma.friendship.findFirst({
		where: {
			 OR: [
					{ requesterId: userId, addresseeId: friendId},
					{ requesterId: friendId, addresseeId: userId },
    		],
		}
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
  deleteRequest,
  blockFriend,
  unblockFriend,
  findMyBlockedUsers,
  findUsersWhoBlockedMe,
  findFriendshipByFriendId
};