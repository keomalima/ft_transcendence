import { friendshipService } from "../services/FriendshipService";
import { RequestData } from "../types";
import profilePicture from '../images/defaultProfile.webp';
import { createFriendCard } from "./FriendList";

export async function FriendRequests(requestsSection: string, friendListSection: string): Promise<void>{
	const content = document.getElementById(requestsSection);
	let list: Partial<RequestData>[] | null = null;
	if (content) {
		try {
			list = await friendshipService.getFriendRequests();
		} catch(error) {
			console.log('error when get requests in dashboard', error);
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
				<h1 class='mb-5'>Requests</h1>
				<h2>Received requests</h2>
				<div id='request-cards' class='flex-1 overflow-auto'></div>
				<h2 class='mt-5'>Sent requests</h2>
			</div>
		`;

		const requestsCards = document.getElementById('request-cards');
		if (requestsCards)
		{
			list.forEach((friend) => {
				requestsCards.appendChild(createRequestCard(friend, friendListSection));
			});
		}

	}
}

function createRequestCard(request: Partial<RequestData>, friendListSection: string): HTMLElement {

	const card = document.createElement('div');
	card.className = 'relative flex items-center bg-stone-100 rounded space-x-3 my-2 py-2 px-3';

	// profile picture ===========
	const avatar = document.createElement('div');
	avatar.className = 'shrink-0';

	const image = document.createElement('img');
	// if (request.friend.avatarUrl)
	// 	avatar.src = `http://localhost:3000/${friend.avatarUrl}`;
	image.src = `${profilePicture}`;
	image.className = 'w-10 h-10 bg-gray-300 rounded-full';
	avatar.appendChild(image);
	// ===========================


	// text content ==============
	const text = document.createElement('div');
	text.className = 'min-w-0 flex-1 pl-3 text-[Inter]';

	const name = document.createElement('p');
	name.innerText = `${request.friend?.displayName}`;
	name.className = 'text-sm font-[Inter]'

	const status = document.createElement('p');
	status.innerText = `${request.friend?.isOnline === true ? 'onilne' : 'offline'}`;
	status.className = `text-xs font-[Inter] ${request.friend?.isOnline === true ? 'text-green-500' : 'text-red-500'}`
	text.appendChild(name);
	text.appendChild(status);
	// ===========================


	// actions ===================
	const actions = document.createElement('div');
	const acceptBtn = document.createElement('button');
	acceptBtn.className = 'btn-primary px-2 py-1 outline-green-500 bg-white text-xs text-green-500 hover:bg-green-500 hover:text-white font-[Inter]';
	acceptBtn.innerText = '+';
	acceptBtn.id = `accept-${request.friend?.id}`;
	// console.log(friend.displayName, ' id -> ', friend.friendshipId);
	actions.appendChild(acceptBtn);
	// ===========================

	card.appendChild(avatar);
	card.appendChild(text);
	card.appendChild(actions);

	acceptBtn.addEventListener('click', (e) => {
		console.log('event accept friend ', request.friend?.name);
		try {
			if (!request.id || !request.friend) {
				console.error('Invalid request data');
				return;
			}
			friendshipService.acceptFriend(request.id);
			card.remove();
			const friendList = document.getElementById(friendListSection);
			friendList?.appendChild(createFriendCard(request.friend));
		} catch (error) {

		}
	});

	return card;
}
