import httpCall from './httpClient.js';
import { ChatMessage } from '../types.js';
import { buildApiError } from './apiError.js';

const BASE_URL = '/chat';

export const chatApi = {
	fetchChatHistory: async (friendId: string): Promise<ChatMessage[]> => {
		if (!friendId)
			throw new Error("Friend ID is required");

		try {
			const response = await httpCall.get(`${BASE_URL}/history/${friendId}`);
			console.log("💬 fetchChatHistory success ✅", response.data);
			return response.data; // array of messages
		} catch (error: unknown) {
			throw buildApiError('fetch chat history', error);
		}
	},

	getFriendsWithNewMessages: async (): Promise<string[]> => {
		try {
			const response = await httpCall.get(`${BASE_URL}/unread`);
			return response.data as string[];
		} catch (error: unknown) {
			throw buildApiError('get unread message friends', error);
		}
	}

};
