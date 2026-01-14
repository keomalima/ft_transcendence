import httpCall from './httpClient.js';
import { ChatMessage, SendMessageError, SendMessageResponse } from '../types.js';
import { buildApiError } from './apiError.js';

const BASE_URL = '/chat';

export const chatApi = {
	fetchChatHistory: async (friendId: string, beforeMessageId?: string): Promise<ChatMessage[]> => {
		if (!friendId)
			throw new Error("Friend ID is required");

		try {
			let url = `${BASE_URL}/history/${friendId}?limit=30`;
			if (beforeMessageId) {
				url += `&before=${beforeMessageId}`;
			}

			const response = await httpCall.get(url);
			console.log("💬 fetchChatHistory success ✅", response.data);
			return response.data || []; // defensive: return [] if data is undefined
		} catch (error: unknown) {
			throw buildApiError('fetch chat history', error);
		}
	},


	// getFriendsWithNewMessages: async (): Promise<string[]> => {
	// 	try {
	// 		const response = await httpCall.get(`${BASE_URL}/unread`);
	// 		return response.data as string[];
	// 	} catch (error: unknown) {
	// 		throw buildApiError('get unread message friends', error);
	// 	}
	// },

	sendMessage: async (data: { toUserId: string; content: string; type?: "TEXT" | "GAME_INVITE";}): Promise<SendMessageResponse> => {
		try {
			const response = await httpCall.post(`${BASE_URL}/send`, data);
			return response.data;
		} catch (error: any) {
			if (error.response?.data?.status === "error") {
				return error.response.data as SendMessageError;
			}

			return {
				status: "error",
				reason: "Unknown error",
				code: "UNKNOWN"
			};
		}
	}
};
