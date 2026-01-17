import { z } from "zod";

// =====================
// Request Schemas
// =====================

const sendMessageRequestSchema = z.object({
	toUserId: z.string(),
	content: z.string().min(1).max(1000), // set the content min and max length
	type: z.enum(["TEXT", "GAME_INVITE"]).optional(),
});

// =====================
// Response Schemas
// =====================

const sendMessageSuccessResponseSchema = z.object({
	status: z.literal("ok"),
	messageId: z.string(),
	sentAt: z.string(),
	gameId: z.string().optional(),
});

const sendMessageErrorResponseSchema = z.object({
	status: z.literal("error"),
	reason: z.string(),
	code: z.enum(["BLOCKED", "SELF", "NOT_FRIEND", "U_IN_GAME", "F_IN_GAME","UNKNOWN"]),
});


const sendMessageResponseSchema = z.union([
	sendMessageSuccessResponseSchema,
	sendMessageErrorResponseSchema,
]);

const chatMessageTextSchema = z.object({
	id: z.string(),
	senderId: z.string(),
	receiverId: z.string(),
	content: z.string().nullable(),
	sentAt: z.string(),
	messageType: z.literal("TEXT"),
});

const chatMessageInviteSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string().nullable(),
  sentAt: z.string(),
  messageType: z.literal("GAME_INVITE"),
  gameId: z.string(),
  gameStatus: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ABANDONED"]),
});

const chatMessageSchema = z.union([chatMessageTextSchema, chatMessageInviteSchema]);

const getChatHistoryResponseSchema = z.array(chatMessageSchema);

const joinGameFromChatRequestSchema = z.object({
	gameId: z.string(),
});

const joinGameFromChatOkSchema = z.object({
	status: z.literal("ok"),
});

const joinGameFromChatErrorSchema = z.object({
	status: z.literal("error"),
	reason: z.string(),
	code: z.enum(["U_IN_GAME", "GAME_NOT_FOUND", "NOT_INVITED", "UNKNOWN"]),
});

const joinGameFromChatResponseSchema = z.union([
	joinGameFromChatOkSchema,
	joinGameFromChatErrorSchema,
]);


// =====================
// Type Exports
// =====================

export type SendMessageInput = z.infer<typeof sendMessageRequestSchema>;
export type JoinGameFromChatInput = z.infer<typeof joinGameFromChatRequestSchema>;


// =====================
// Schema Objects Export
// =====================

export const chatSchemas = {
	request: {
		sendMessage: sendMessageRequestSchema,
		joinGameFromChat: joinGameFromChatRequestSchema,
	},
	response: {
		getChatHistory: getChatHistoryResponseSchema,
		sendMessage: sendMessageResponseSchema,
		joinGameFromChat: joinGameFromChatResponseSchema,
	},
};
