import httpCall from './httpClient.js';
import { FriendData } from '../types';
import { buildApiError } from './apiError.js';

const BASE_URL = '/friends';

export const friendshipApi = {

	getList: async (): Promise<Partial<FriendData>[]> => {
		try {
			const response = await httpCall.get<Partial<FriendData>[]>(`${BASE_URL}`);
			console.log('🧑‍🤝‍🧑 getFriendList sucess ✅ ', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('get list of friends', error);
		}
	},

	sendRequest: async (displayName: string | null): Promise<void> => {
		if (displayName == null)
			throw new Error('Display name is required');
		try {
			await httpCall.post(`${BASE_URL}`, {
				addresseeDisplayName: displayName
			});
			console.log('🧑‍🤝‍🧑 sendFriendshipRequest sucess ✅ ');
		} catch (error: unknown) {
			throw buildApiError('send friendship request', error);
		}
	},
	
	getRequests: async (): Promise<Partial<FriendData>[]> => {
		try {
			const response = await httpCall.get<Partial<FriendData>[]>(`${BASE_URL}/requests`);
			console.log('🧑‍🤝‍🧑 getFriendRequests sucess ✅ ', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('get friend requests', error);
		}
	},

	accept: async (id: string | null): Promise<void> => {
		if (id == null)
			throw new Error('Request ID is required');
		try {
			await httpCall.put(`${BASE_URL}/accept/${id}`);
			console.log('🧑‍🤝‍🧑 acceptFriend sucess ✅ ');
		} catch (error: unknown) {
			throw buildApiError('accept friend', error);
		}
	},

	reject: async (id: string | null): Promise<void> => {
		if (id == null)
			throw new Error('Request ID is required');
		try {
			await httpCall.put(`${BASE_URL}/reject/${id}`);
			console.log('🧑‍🤝‍🧑 rejectFriend sucess ✅ ');
		} catch (error: unknown) {
			throw buildApiError('reject friend', error);
		}
	},

	delete: async (id: string | null): Promise<void> => {
		if (id == null)
			throw new Error('Friendship ID is required');
		try {
			await httpCall.delete(`${BASE_URL}/${id}`);
			console.log('🧑‍🤝‍🧑 deleteFriend sucess ✅ ');
		} catch (error: unknown) {
			throw buildApiError('delete friend', error);
		}
	},
}
