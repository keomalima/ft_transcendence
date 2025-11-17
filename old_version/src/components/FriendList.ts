import { friendshipService } from "../services/FriendshipService";
import { FriendData } from "../types";
import profilePicture from '../images/defaultProfile.webp';

export async function FriendList(root: string): Promise<void>{
	const content = document.getElementById(root);
	let list: Partial<FriendData>[] | null = null;
	if (content) {
		try {
			list = await friendshipService.getFriendList();
		} catch(error) {
			console.log('error when get friend list in dashboard', error);
			return;
		}

		if (!list) {
			content.innerHTML = /*html*/`
				<p>No friend for the moment</p>
				<p>Don't be shy! Let's add some friends.</p>
			`;
			return;
		};

		content.innerHTML = /*html*/`
			<div class='h-full flex flex-col'>
				<h1 class='mb-5'>Friends</h1>
				<div id='friend-cards' class='flex-1 overflow-auto'></div>
			</div>
		`;

		const friendCards = document.getElementById('friend-cards');
		if (friendCards)
		{
			list.forEach((friend) => {
				friendCards.appendChild(createFriendCard(friend));
			});
		}

	}
}

export function createFriendCard(friend: Partial<FriendData>): HTMLElement {

	const card = document.createElement('div');
	card.className = 'relative flex items-center bg-stone-100 rounded space-x-3 my-2 py-2 px-3';

	// profile picture ===========
	const avatar = document.createElement('div');
	avatar.className = 'shrink-0';

	const image = document.createElement('img');
	// if (friend.avatarUrl)
	// 	avatar.src = `http://localhost:3000/${friend.avatarUrl}`;
	image.src = `${profilePicture}`;
	image.className = 'w-10 h-10 bg-gray-300 rounded-full';
	avatar.appendChild(image);
	// ===========================


	// text content ==============
	const text = document.createElement('div');
	text.className = 'min-w-0 flex-1 pl-3 text-[Inter]';

	const name = document.createElement('p');
	name.innerText = `${friend.displayName}`;
	name.className = 'text-sm font-[Inter]'

	const status = document.createElement('p');
	status.innerText = `${friend.isOnline === true ? 'onilne' : 'offline'}`;
	status.className = `text-xs font-[Inter] ${friend.isOnline === true ? 'text-green-500' : 'text-red-500'}`
	text.appendChild(name);
	text.appendChild(status);
	// ===========================


	// actions ===================
	const actions = document.createElement('div');
	const deleteBtn = document.createElement('button');
	deleteBtn.className = 'btn-primary px-2 py-1 outline-red-500 bg-stone-100 text-xs text-red-500 hover:bg-red-500 hover:text-white font-[Inter]';
	deleteBtn.innerText = 'x';
	deleteBtn.id = `delete-${friend.id}`;
	// console.log(friend.displayName, ' id -> ', friend.friendshipId);
	actions.appendChild(deleteBtn);
	// ===========================

	card.appendChild(avatar);
	card.appendChild(text);
	card.appendChild(actions);

	deleteBtn.addEventListener('click', (e) => {
		console.log('event delete friend on ', friend.name);
		try {
			if (friend.friendshipId)
				friendshipService.deleteFriend(friend.friendshipId);
			// navigateTo('/dashboard');
			card.remove();
		} catch (error) {

		}
	});

	return card;
}
