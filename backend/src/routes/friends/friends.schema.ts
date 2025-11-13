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

const sendRequestResponseSchema = z.object({
	id: z.string(),
    requesterId: z.string(),
    addresseeId: z.string(),
    status: z.enum(FriendshipStatus),
    createdAt: z.date(),
    updatedAt: z.date()
});

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
	sendRequest: sendRequestResponseSchema
  },
};
