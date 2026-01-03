import { z } from "zod";

// =====================
// Request Schemas
// =====================

const sendMessageRequestSchema = z.object({
	toUserId: z.string(),
	content: z.string().min(1).max(1000), // set the content min and max length
});

// =====================
// Response Schemas
// =====================

const sendMessageSuccessResponseSchema = z.object({
	status: z.literal("ok"),
	messageId: z.string(),
	sentAt: z.string(),
});

const sendMessageErrorResponseSchema = z.object({
	status: z.literal("error"),
	reason: z.string(),
});

const sendMessageResponseSchema = z.union([
	sendMessageSuccessResponseSchema,
	sendMessageErrorResponseSchema,
]);

const chatMessageSchema = z.object({
	senderId: z.string(),
	receiverId: z.string(),
	content: z.string(),
});

const getChatHistoryResponseSchema = z.array(chatMessageSchema);

// =====================
// Type Exports
// =====================

export type SendMessageInput = z.infer<typeof sendMessageRequestSchema>;

// =====================
// Schema Objects Export
// =====================

export const chatSchemas = {
	request: {
		sendMessage: sendMessageRequestSchema,
	},
	response: {
		getChatHistory: getChatHistoryResponseSchema,
		sendMessage: sendMessageResponseSchema,
	},
};
