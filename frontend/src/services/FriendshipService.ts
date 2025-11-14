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
			throw new ErrorEvent(`Failed to get list of friends: ${response.statusText}`);
		const result: Partial<FriendData>[] = await response.json();
		console.log('🧑‍🤝‍🧑 getFriendList sucess ✅ ', result);
		return result;
	}

	// send friendship request
	// get friendship request
	// accept friendship request
	// reject frienship request
	// delete friendship
}

export const friendshipService = new FriendshipService();
