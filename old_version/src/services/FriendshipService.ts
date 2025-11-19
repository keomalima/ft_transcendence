import { FriendData } from "../types";
import { userStore } from "../store/UserStorage";

const url = 'http://localhost:3000/api/friends';

class FriendshipService {

	// get friend list
	async getFriendList(): Promise<Partial<FriendData>[]> {
		const response = await fetch (`${url}`, {
			method: 'GET',
			headers:{
				'Authorization': `Bearer ${userStore.getUserAccessToken()}`}
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to get list of friends: ${response.statusText}`);
		const result: Partial<FriendData>[] = await response.json();
		console.log('🧑‍🤝‍🧑 getFriendList sucess ✅ ', result);
		return result;
	}

	// send friendship request
	async sendFriendshipRequest(displayName: string | null): Promise<void> {
		if (displayName == null)
			return;
		const response = await fetch (`${url}`, {
			method: 'POST',
			headers:{
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${userStore.getUserAccessToken()}`},
			body: JSON.stringify({
				addresseeDisplayName: displayName
			})
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to send friendship requests: ${response.statusText}`);
		console.log('🧑‍🤝‍🧑 sendFriendshipRequest sucess ✅ ');
	}

	// get friendship request
	async getFriendRequests(): Promise<Partial<FriendData>[]> {
		const response = await fetch (`${url}/requests`, {
			method: 'GET',
			headers:{
				'Authorization': `Bearer ${userStore.getUserAccessToken()}`}
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to get friend requests: ${response.statusText}`);
		const result: Partial<FriendData>[] = await response.json();
		console.log('🧑‍🤝‍🧑 getFriendRequests sucess ✅ ', result);
		return result;
	}

	// accept friendship request
	async acceptFriend(id: string | null): Promise<void> {
		if (id == null)
			return;
		const response = await fetch (`${url}/accept/${id}`, {
			method: 'PUT',
			headers:{
				'Authorization': `Bearer ${userStore.getUserAccessToken()}`}
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to accept friend: ${response.statusText}`);
		console.log('🧑‍🤝‍🧑 acceptFriend sucess ✅ ');
	}

	// reject frienship request

	// delete friendship
	async deleteFriend(id: string | null): Promise<void> {
		if (id == null)
			return;
		const response = await fetch (`${url}/${id}`, {
			method: 'DELETE',
			headers:{
				'Authorization': `Bearer ${userStore.getUserAccessToken()}`}
		});
		if (!response.ok)
			throw new ErrorEvent(`❌ Failed to delete friend: ${response.statusText}`);
		console.log('🧑‍🤝‍🧑 deleteFriend sucess ✅ ');
	}
}

export const friendshipService = new FriendshipService();
