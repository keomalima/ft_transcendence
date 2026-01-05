import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FriendsRequestInput } from './friends.schema.js';
import { friendsService } from './friends.service.js'
import type { User } from '@prisma/client';

// =====================
// Friends CRUD Handlers
// =====================

declare module 'fastify' {
  interface FastifyRequest {
	user?: User;
  }
}

async function getFriendsHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const requesterId = request.user!.id;
		const friendships = await friendsService.findActiveFriends(request.server.prisma, requesterId);
		const blocked = await friendsService.findMyBlockedUsers(request.server.prisma, requesterId);
		const blockedBy = await friendsService.findUsersWhoBlockedMe(request.server.prisma, requesterId);
		
		const blockedIds = new Set(
			blocked.map((b: { blockedId: string }) => b.blockedId)
		);

		const blockedByIds = new Set(
			blockedBy.map((b: { blockerId: string }) => b.blockerId)
		);


		const friends = friendships.map((f: typeof friendships[0]) => {
		    const friend = f.requesterId === requesterId ? f.addressee : f.requester;
		    const { password, salt, email, isOnline, ...safeFriend } = friend;
			const isOnlineCheck = isFriendOnline(friend.lastSeenAt)

		    return {
		        friendshipId: f.id,
				isOnline: isOnlineCheck,
				isBlocked: blockedIds.has(friend.id),
				isBlockedBy: blockedByIds.has(friend.id),
		        ...safeFriend
		    };
		});
		return friends
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to find friends"});
	}
}

async function sendRequestHandler(request: FastifyRequest<{ Body: FriendsRequestInput }>, reply: FastifyReply) {
	try {
		const { addresseeDisplayName } = request.body
		const requesterId = request.user!.id;

		const addresseeUser = await friendsService.findUserByDisplayName(request.server.prisma, addresseeDisplayName)
		if (!addresseeUser) {
			return reply.code(404).send({
				message: "User not found"
			});
		}

		if (addresseeUser.id === requesterId) {
			return reply.code(400).send({
                message: "Cannot send friend request to yourself"
            });
		}

		const existingFriendship = await friendsService.findFriendshipRequest(request.server.prisma, addresseeUser.id, requesterId);
		if (existingFriendship) {
			return reply.code(409).send({
				message: "Friendship request already exists"
			});
		}
		const friendship = await friendsService.sendRequest(request.server.prisma, 
            requesterId,
            addresseeUser.id)
		return reply.code(201).send(friendship);
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to send friendship request"});
	}
}

async function acceptFriendHandler(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
	try {
		const requestId = request.params.id;
		if (!requestId) {
			return reply.code(400).send({
                message: "Missing request id"
            });
		}
		const friendship = await friendsService.findRequestById(request.server.prisma, requestId)
		if (!friendship) {
			return reply.code(404).send({
                message: "Friendship does not exist"
            });
		}
		if (friendship.addresseeId !== request.user!.id) {
			return reply.code(403).send({
                message: "Can not accept friendship"
            });
		}
		if (friendship.status !== 'PENDING') {
			return reply.code(409).send({
                message: "Friendship request is not pending"
            });
		}
		return await friendsService.acceptRequest(request.server.prisma, requestId)
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to accept friendship request"});
	}
}

async function rejectFriendHandler(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
	try {
		const requestId = request.params.id;
		if (!requestId) {
			return reply.code(400).send({
                message: "Missing request id"
            });
		}
		const friendship = await friendsService.findRequestById(request.server.prisma, requestId)
		if (!friendship) {
			return reply.code(404).send({
                message: "Friendship does not exist"
            });
		}
		if (friendship.addresseeId !== request.user!.id) {
			return reply.code(403).send({
                message: "Can not reject friendship"
            });
		}
		if (friendship.status !== 'PENDING') {
			return reply.code(409).send({
                message: "Friendship request is not pending"
            });
		}
		reply.code(204).send(await friendsService.deleteRequest(request.server.prisma, requestId))
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to reject friendship request"});
	}
}

async function getPendingRequestsHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = request.user!.id;

		const pending = await friendsService.findPendingRequests(request.server.prisma, userId)
		const newArray = pending.map((f: typeof pending[0]) => ({
			id: f.id,
			createdAt: f.createdAt,
			friend: f.requester
		}))
		const safeRequests = newArray.map((f: typeof newArray[0]) => {
			const { password, salt, email, ...safeFriend } = f.friend;
			return {
				id: f.id,
				createdAt: f.createdAt,
				friend: {
					...safeFriend,
					isOnline: isFriendOnline(f.friend.lastSeenAt)
				}
			}
		})
		return safeRequests
	} catch (error: any) {
		reply.code(500).send({ message: "Failed to fetch pending requests"});
	}
}

async function deleteFriendHandler(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
	try {
		const requestId = request.params.id;
		if (!requestId) {
			return reply.code(400).send({
                message: "Missing request id"
            });
		}
		const friendship = await friendsService.findRequestById(request.server.prisma, requestId)
		if (!friendship) {
			return reply.code(404).send({
                message: "Friendship does not exist"
            });
		}
		if (friendship.addresseeId !== request.user!.id && friendship.requesterId !== request.user!.id) {
			return reply.code(403).send({
                message: "Can not reject friendship"
            });
		}
		if (friendship.status !== 'ACCEPTED') {
			return reply.code(409).send({
                message: "Can not delete a request that was not accepted"
            });
		}

		const deleted = await friendsService.deleteRequest(  request.server.prisma, requestId );

		if (!deleted) {
			return reply.code(404).send({
				message: "Friendship does not exist"
			});
		}

		return reply.code(204).send();

	} catch (error: any) {
		reply.code(500).send({ message: "Failed to delete request"});
	}
}

async function blockFriend(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
	try {
		const friendId = request.params.id;
		const userId = request.user!.id;

		// extra safe check that cannot self-block
		if (friendId === userId) {
			return reply.code(400).send({ message: "Cannot block yourself" });
		}

		// check friendship exist
		const friendship = await friendsService.findFriendshipByFriendId(request.server.prisma, userId, friendId);
		if (!friendship) {
			return reply.code(404).send({ message: "Friendship does not exist" });
		}

		const block = await friendsService.blockFriend(request.server.prisma, userId, friendId);
		if (!block) {
			return reply.code(409).send({ message: "Your friend is already blocked" });
		}
		return reply.code(200).send(block);

	} catch (error: any) {
		reply.code(500).send({ message: "Failed to block friend"});
	}
}

async function unblockFriend(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
	try {
		const friendId = request.params.id;
		const userId = request.user!.id;

		// extra safe check that cannot self-unblock
		if (friendId === userId) {
			return reply.code(400).send({ message: "Cannot unblock yourself" });
		}

		// check friendship exist
		const friendship = await friendsService.findFriendshipByFriendId(request.server.prisma, userId, friendId);
		if (!friendship) {
			return reply.code(404).send({ message: "Friendship does not exist" });
		}

		const success = await friendsService.unblockFriend(request.server.prisma, userId, friendId);
		if (!success) {
			return reply.code(404).send({ message: "Your friend is not blocked yet" });
		}

		return reply.code(200).send({ success: true });

	} catch (error: any) {
		return reply.code(500).send({ message: "Failed to unblock friend" });
	}
}


// =====================
// Helper Functions
// =====================

function isFriendOnline (date: Date | null): boolean {
	if (!date) {
		return false;
	}
	const fiveMinutes = 5 * 60 * 1000;
	const now = Date.now();
	return now - date.getTime() < fiveMinutes;
}

// =====================
// Export Controller Object
// =====================

export const friendsController = {
	getFriendsHandler,
	sendRequestHandler,
	acceptFriendHandler,
	getPendingRequestsHandler,
	rejectFriendHandler,
	deleteFriendHandler,
	blockFriend,
	unblockFriend
};