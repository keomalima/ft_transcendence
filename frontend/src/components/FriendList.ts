import { friendshipApi } from "../api/friendshipApi.js";
import { AppContext } from "../types.js";
import type { FriendData } from "../types.js";

export class FriendList extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _list: Partial<FriendData>[] | null = null;
	private _accessToken: string | null = null;
	
	constructor() {
		super();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
		// Load data when ctx is set and component is connected
		if (this.isConnected) {
			this.loadAndRender();
		}
	}

	async connectedCallback() {
		// Load data if ctx is already set
		if (this._ctx) {
			await this.loadAndRender();
		}
		
		// Listen for friend list updates
		window.addEventListener('friend-list-updated', this.loadAndRender.bind(this));
	}

	disconnectedCallback() {
		// Clean up event listener when component is removed
		window.removeEventListener('friend-list-updated', this.loadAndRender.bind(this));
	}

	private async loadAndRender() {
		await this.getFriendList();
		this.render();
		this.displayFriendCards();
	}

	private render() {
		if (!this._list) {
			this.innerHTML = 
			/*html*/`
				<div class='h-full flex flex-col'>
					<h1 class='mb-5'>Friends</h1>
					<p>No friend for the moment</p>
					<p>Don't be shy! Let's add some friends.</p>
				</div>
			`;
		} else {
			this.innerHTML = 
			/*html*/`
				<div class='h-full flex flex-col'>
					<h1 class='mb-5'>Friends</h1>
					<div id='friend-cards' class='flex-1 overflow-auto'></div>
				</div>
			`;
		}
	}

	private async getFriendList(): Promise<void> {
		const currentUser = this._ctx?.userStore.get();
		const token = currentUser?.accessToken;
		if (token !== undefined)
			this._accessToken = token;
		if (!this._accessToken)
			return;
		try {
			this._list = await friendshipApi.getList(this._accessToken);
		} catch(error) {
			console.log(error);
		}
	}

	private displayFriendCards(): void {
		if (!this._accessToken)
			return;
		const friendCards = document.getElementById('friend-cards');
		if (friendCards && this._list)
		{
			this._list.forEach((friend) => {
				friendCards.appendChild(this.createFriendCard(friend));
			});
		}
	}

	private createFriendCard(friend: Partial<FriendData>): HTMLElement {

		const card = document.createElement('div');
		card.className = 'relative flex items-center bg-stone-100 rounded space-x-3 my-2 py-2 px-3';

		// profile picture ===========
		const avatar = document.createElement('div');
		avatar.className = 'shrink-0';

		const image = document.createElement('img');
		// if (friend.avatarUrl)
		// 	image.src = `http://localhost:3000/${friend.avatarUrl}`;
		image.src = '/src/images/ProfilePictureSquared.png';
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
		deleteBtn.className = 'font-[Inter] rounded-full px-2 py-1 text-xs text-red-500 outline outline-1 outline-red-500 hover:bg-red-500 hover:text-white';
		deleteBtn.innerText = 'x';
		deleteBtn.id = `delete-${friend.id}`;
		actions.appendChild(deleteBtn);
		// ===========================

		card.appendChild(avatar);
		card.appendChild(text);
		card.appendChild(actions);

		

		deleteBtn.addEventListener('click', (e) => {
			console.log('event delete friend on ', friend.name);
			this.dispatchEvent(new CustomEvent('event-delete-friend', {
				detail: {
					friendshipId: friend.friendshipId as string,
					accessToken: this._accessToken as string
				},
				bubbles: true
			}));
		});

		
		return card;
	}
}

customElements.define('friend-list', FriendList);
