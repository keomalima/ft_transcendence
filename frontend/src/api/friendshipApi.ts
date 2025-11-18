const BASE_URL = 'http://localhost:3000/api/friends';

import { FriendData } from "../types";

 
export const friendshipApi = {

	getList: async (accessToken: string): Promise<Partial<FriendData>[]> => {
		const response = await fetch (`${BASE_URL}`, {
			method: 'GET',
			headers:{
				'Authorization': `Bearer ${accessToken}`}
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to get list of friends: ${response.statusText}`);
		const result: Partial<FriendData>[] = await response.json();
		console.log('🧑‍🤝‍🧑 getFriendList sucess ✅ ', result);
		return result;
	},

	sendRequest: async (displayName: string | null, accessToken: string): Promise<void> => {
		if (displayName == null)
			return;
		const response = await fetch (`${BASE_URL}`, {
			method: 'POST',
			headers:{
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`},
			body: JSON.stringify({
				addresseeDisplayName: displayName
			})
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to send friendship requests: ${response.statusText}`);
		console.log('🧑‍🤝‍🧑 sendFriendshipRequest sucess ✅ ');
	},
	
	getRequests: async (accessToken: string): Promise<Partial<FriendData>[]> => {
		const response = await fetch (`${BASE_URL}/requests`, {
			method: 'GET',
			headers:{
				'Authorization': `Bearer ${accessToken}`}
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to get friend requests: ${response.statusText}`);
		const result: Partial<FriendData>[] = await response.json();
		console.log('🧑‍🤝‍🧑 getFriendRequests sucess ✅ ', result);
		return result;
	},

	accept: async (id: string | null, accessToken: string): Promise<void> => {
		if (id == null)
			return;
		const response = await fetch (`${BASE_URL}/accept/${id}`, {
			method: 'PUT',
			headers:{
				'Authorization': `Bearer ${accessToken}`}
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to accept friend: ${response.statusText}`);
		console.log('🧑‍🤝‍🧑 acceptFriend sucess ✅ ');
	},

	delete: async (id: string | null, accessToken: string): Promise<void> => {
		if (id == null)
			return;
		const response = await fetch (`${BASE_URL}/${id}`, {
			method: 'DELETE',
			headers:{
				'Authorization': `Bearer ${accessToken}`}
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to delete friend: ${response.statusText}`);
		console.log('🧑‍🤝‍🧑 deleteFriend sucess ✅ ');
	},
}

