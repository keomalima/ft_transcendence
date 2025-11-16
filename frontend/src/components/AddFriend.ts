import { navigateTo } from "../main";
import { friendshipService } from "../services/FriendshipService";
import { FriendshipData } from "../types";

export async function AddFriend(root: string): Promise<void> {
	if (!root)
		return;
	const content = document.getElementById(root);
	if (!content)
		return;

	content.innerHTML = /*html*/`
		<h1 class='mb-5'>Add a friend</h1>

		<form id='add-friend-form' class='flex items-center justify-between'>
			<div>
				<input id="friend-name" type="text" name="friend_name" placeholder="friend username" class="block w-full rounded-md px-3 py-1.5 text-stone-900 outline-1 -outline-offset-1 outline-stone-300 placeholder:text-stone-400 focus:outline-2 focus:-outline-offset-2 focus:outline-muted sm:text-sm/6" />
			</div>
			<button id='add-friend-btn' type='submit' class='btn-primary text-sm bg-white hover:bg-black'>Add</button>
		</form>
	`

	const form = document.getElementById('add-friend-form') as HTMLFormElement;
	form?.addEventListener('submit', (e) => {
		e.preventDefault();
		console.log('submit add friend form');

		try {
			const formData = new FormData(form);
			console.log(formData);
			const friendName: string = formData.get('friend_name') as string;

			friendshipService.sendFriendshipRequest(friendName);
		} catch (error) {

		}
	})
}
