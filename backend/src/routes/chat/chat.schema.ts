import { z } from "zod";

// =====================
// RESPONSE SCHEMAS
// =====================

const messageSchema = z.object({
	senderId: z.string(),
	receiverId: z.string(),
	content: z.string(),
});

const getChatHistory = z.array(messageSchema);

// =====================
// EXPORT
// =====================

export const chatSchemas = {
	response: {
		getChatHistory,
	}
};
