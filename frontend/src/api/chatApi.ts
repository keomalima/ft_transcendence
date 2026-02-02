import httpCall from './httpClient.js';
import { ChatMessage, DeclineGameFromChatInput, DeclineGameFromChatResponse, GetPendingInviteResponse, JoinGameFromChatInput, JoinGameFromChatResponse, SendMessageError, SendMessageResponse } from '../types.js';
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
			// console.log("💬 fetchChatHistory success ✅", response.data);
			return response.data || []; // defensive: return [] if data is undefined
		} catch (error: unknown) {
			throw buildApiError('fetch chat history', error);
		}
	},


	getFriendsWithNewMessages: async (): Promise<string[]> => {
		try {
			const response = await httpCall.get(`${BASE_URL}/unread`);
			// console.log("🔔 getFriendsWithNewMessages success ✅", response.data);
			return response.data as string[];
		} catch (error: unknown) {
			throw buildApiError('get unread message friends', error);
		}
	},


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
	},

	createNotification: async (senderId: string): Promise<void> => {
		try {
			await httpCall.post(`${BASE_URL}/notify`, { senderId });
		} catch (error: unknown) {
			throw buildApiError('create notification', error);
		}
	},

	deleteNotification: async (senderId: string): Promise<void> => {
		try {
			await httpCall.delete(`${BASE_URL}/notify`, { data: { senderId }});
		} catch (error: unknown) {
			throw buildApiError('delete notification', error);
		}
	},

	joinGameFromChat: async (data: JoinGameFromChatInput): Promise<JoinGameFromChatResponse> => {
		try {
			const response = await httpCall.post(`${BASE_URL}/join-game`, data);
			return response.data as JoinGameFromChatResponse;
		} catch (error: any) {
			const errData = error?.response?.data;
			if (errData && (errData.status === "error" || errData.status === "ok")) {
				return errData as JoinGameFromChatResponse;
			}
			return { status: "error", reason: "Unknown error", code: "UNKNOWN" };
		}
	},

	getPendingInvite: async (friendId: string): Promise<GetPendingInviteResponse> => {
		try {
			const response = await httpCall.get(`${BASE_URL}/pending-invite/${friendId}`);
			return response.data as GetPendingInviteResponse;
		} catch (error: any) {
			const errData = error?.response?.data;
			if (errData && (errData.status === "error" || errData.status === "ok")) {
				return errData as GetPendingInviteResponse;
			}
			return { status: "error", reason: "Unknown error", code: "UNKNOWN" };
		}
	},

	getGoToGameId: async (friendId: string): Promise<GetPendingInviteResponse> => {
		try {
			const response = await httpCall.get(`${BASE_URL}/go-to-game/${friendId}`);
			return response.data as GetPendingInviteResponse;
		} catch (error: any) {
			const errData = error?.response?.data;
			if (errData && (errData.status === "error" || errData.status === "ok")) {
				return errData as GetPendingInviteResponse;
			}
			return { status: "error", reason: "Unknown error", code: "UNKNOWN" };
		}
	},

	declineGameFromChat: async (data: DeclineGameFromChatInput): Promise<DeclineGameFromChatResponse> => {
		try {
			const response = await httpCall.post(`${BASE_URL}/decline-game`, data);
			return response.data as DeclineGameFromChatResponse;
		} catch (error: any) {
			const errData = error?.response?.data;
			if (errData && (errData.status === "error" || errData.status === "ok")) {
				return errData as DeclineGameFromChatResponse;
		}
			return { status: "error", reason: "Unknown error", code: "UNKNOWN" };
		}
	},

};
