import { z } from "zod";
import { FriendshipStatus } from "@prisma/client";

// =====================
// Request Schemas
// =====================

const sendRequestSchema = z.object({
	addresseeDisplayName: z.string()
});

// =====================
// Response Schemas
// =====================

const blockFriendResponseSchema = z.object({
	id: z.string(),
	status: z.enum(FriendshipStatus),
	// deletedAt: z.date()
})

const getFriendsResponseSchema = z.object({
	id: z.string(),
	friendshipId: z.string(),
	displayName: z.string(),
	isOnline: z.boolean(),
	name: z.string(),
	surname: z.string(),
	avatarUrl: z.string(),
	isBlocked: z.boolean()
})

const friendsArraySchema = z.array(getFriendsResponseSchema);

const sendRequestResponseSchema = z.object({
	id: z.string(),
    requesterId: z.string(),
    addresseeId: z.string(),
    status: z.enum(FriendshipStatus),
    createdAt: z.date(),
    updatedAt: z.date()
});

const getFriendsRequestResponseSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	friend: z.object({
		id: z.string(),
		displayName: z.string(),
		isOnline: z.boolean(),
		name: z.string(),
		surname: z.string(),
		avatarUrl: z.string()
	})
})

const friendsRequestArraySchema = z.array(getFriendsRequestResponseSchema)

// =====================
// Type Exports
// =====================

export type FriendsRequestInput = z.infer<typeof sendRequestSchema>;

// =====================
// Schema Objects Export
// =====================

export const friendsSchemas = {
  // Request schemas
  request: {
	sendRequest: sendRequestSchema
  },
  
  // Response schemas
  response: {
	getFriends: friendsArraySchema,
	sendRequest: sendRequestResponseSchema,
	acceptRequest: sendRequestResponseSchema,
	pendingRquest: friendsRequestArraySchema,
	blockFriend: blockFriendResponseSchema
  },
};
