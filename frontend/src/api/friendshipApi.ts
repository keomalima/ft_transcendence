import { API_BASE_URL } from '../config.js';

const BASE_URL = `${API_BASE_URL}/api/friends`; // localhost:3000 in dev, proxied /api in prod

import { FriendData } from "../types";

 
export const friendshipApi = {

	getList: async (): Promise<Partial<FriendData>[]> => {
		const response = await fetch (`${BASE_URL}`, {
			method: 'GET',
			credentials: 'include',
		});
		if (!response.ok) {
			console.log('❌ Failed to get list of friends');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to get list of friends');
		}
		const result: Partial<FriendData>[] = await response.json();
		console.log('🧑‍🤝‍🧑 getFriendList sucess ✅ ', result);
		return result;
	},

	sendRequest: async (displayName: string | null): Promise<void> => {
		if (displayName == null)
			throw new Error('Display name is required');
		const response = await fetch (`${BASE_URL}`, {
			method: 'POST',
			credentials: 'include',
			headers:{
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				addresseeDisplayName: displayName
			})
		});
		if (!response.ok) {
			console.log('❌ Failed to send friendship request');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to send friendship request');
		}
		console.log('🧑‍🤝‍🧑 sendFriendshipRequest sucess ✅ ');
	},
	
	getRequests: async (): Promise<Partial<FriendData>[]> => {
		const response = await fetch (`${BASE_URL}/requests`, {
			method: 'GET',
			credentials: 'include'
		});
		if (!response.ok) {
			console.log('❌ Failed to get friend requests');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to get friend requests');
		}
		const result: Partial<FriendData>[] = await response.json();
		console.log('🧑‍🤝‍🧑 getFriendRequests sucess ✅ ', result);
		return result;
	},

	accept: async (id: string | null): Promise<void> => {
		if (id == null)
			throw new Error('Request ID is required');
		const response = await fetch (`${BASE_URL}/accept/${id}`, {
			method: 'PUT',
			credentials: 'include'
		});
		if (!response.ok) {
			console.log('❌ Failed to accept friend');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to accept friend');
		}
		console.log('🧑‍🤝‍🧑 acceptFriend sucess ✅ ');
	},

	reject: async (id: string | null): Promise<void> => {
		if (id == null)
			throw new Error('Request ID is required');
		const response = await fetch (`${BASE_URL}/reject/${id}`, {
			method: 'PUT',
			credentials: 'include'
		});
		if (!response.ok) {
			console.log('❌ Failed to reject friend');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to reject friend');
		}
		console.log('🧑‍🤝‍🧑 rejectFriend sucess ✅ ');
	},

	delete: async (id: string | null): Promise<void> => {
		if (id == null)
			throw new Error('Friendship ID is required');
		const response = await fetch (`${BASE_URL}/${id}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			console.log('❌ Failed to delete friend');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to delete friend');
		}
		console.log('🧑‍🤝‍🧑 deleteFriend sucess ✅ ');
	},
}

