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

async function sendRequestHandler(request: FastifyRequest<{ Body: FriendsRequestInput, Params: { id: string } }>, reply: FastifyReply) {
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

// =====================
// Export Controller Object
// =====================

export const friendsController = {
	// User CRUD
	sendRequestHandler
};