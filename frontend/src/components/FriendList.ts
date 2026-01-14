import { friendshipApi } from "../api/friendshipApi.js";
import { AppContext } from "../types.js";
import type { FriendData } from "../types.js";

export class FriendList extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _list: Partial<FriendData>[] | null = null;
	private _uploadsUrl: string = 'http://localhost:3000';
	private _isLoading: boolean = false;

	public skipAutoSelect: boolean = false; // for Live Chat logic
	
	constructor() {
		super();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
		if (this.isConnected) {
			this.loadAndRender();
		}
	}

	async connectedCallback() {
		if (this._ctx && !this._isLoading) {
			await this.loadAndRender();
		}
	}

	public async loadAndRender() {
		if (this._isLoading) return;
		this._isLoading = true;
		
		await this.getFriendList();

		this.render();
		this.displayFriendCards();

		// announce that friends are loaded
		this.dispatchEvent(
			new CustomEvent('friends-loaded', {
				detail: this._list ?? [],
				bubbles: true
			})
		);
		
		this._isLoading = false;
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
				
				<!-- Confirmation Dialog -->
				<dialog id="delete-friend-dialog" class="fixed inset-0 m-auto w-fit h-fit rounded-lg shadow-lg p-6 backdrop:bg-black backdrop:bg-opacity-50">
					<div class="flex flex-col gap-4">
						<h2 class="text-xl font-semibold">Delete Friend</h2>
						<p id="delete-friend-message" class="text-gray-600">Are you sure you want to remove this friend?</p>
						<div class="flex gap-3 justify-end">
							<button id="cancel-delete-btn" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
							<button id="confirm-delete-btn" class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white">Delete</button>
						</div>
					</div>
				</dialog>
			`;
		}
	}

	private async getFriendList(): Promise<void> {
		try {
			this._list = await friendshipApi.getList();
		} catch(error) {
			console.log(error);
		}
	}

	private displayFriendCards(): void {
		const friendCards = document.getElementById('friend-cards');
		if (!friendCards)
			return;

		// Check if there are no friend
		if (!this._list || this._list.length === 0) {
			friendCards.innerHTML = /*html*/`
				<div class='flex flex-col items-center justify-center h-full gap-4'>
					<svg class="w-16 h-16 text-gray-400 size-7 stroke-1 stroke-gray-300 fill-none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
					<p class="text-gray-600 text-lg text-center">No friend for the moment.<br>Don't be shy! Let's add some friends.</p>
				</div>
			`;
			return;
		}

		if (friendCards && this._list)
		{
			this._list.forEach((friend) => {
				friendCards.appendChild(this.createFriendCard(friend));
			});
		}
	}

	private createFriendCard(friend: Partial<FriendData>): HTMLElement {
		const card = document.createElement('div');

		card.className = 'relative flex items-center bg-stone-100 rounded gap-3 my-2 py-2 px-3';

		// profile picture ===========
		const avatar = document.createElement('div');
		avatar.className = 'shrink-0';

		const image = document.createElement('img');

		// === Blue dot for new message (only in LiveChat)
		// const isLiveChatPage = window.location.pathname === '/live-chat';
		// if (isLiveChatPage) {
		// 	const currentUserId = this._ctx?.userStore.get()?.id;
		// 	const key = `chat_unread_${currentUserId}`;
		// 	try {
		// 		const raw = localStorage.getItem(key);
		// 		if (raw) {
		// 			const unreadList: string[] = JSON.parse(raw);
		// 			if (friend.id && unreadList.includes(friend.id)) {
		// 				const dot = document.createElement('span');
		// 				dot.className = 'absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-500';
		// 				avatar.appendChild(dot);
		// 			}
		// 		}
		// 	} catch (e) {
		// 		console.error("❌ Failed to read unread list from localStorage", e);
		// 	}
		// }

		image.src = `${this._uploadsUrl}${friend.avatarUrl}`;
		image.className = 'w-10 h-10 bg-gray-300 rounded-full object-cover';
		avatar.appendChild(image);
		// ===========================


		// text content ==============
		const text = document.createElement('div');
		text.className = 'min-w-0 flex-1 text-[Inter]';

		const name = document.createElement('p');
		name.innerText = `${friend.displayName}`;
		name.className = 'text-sm font-[Inter] truncate'

		const status = document.createElement('p');
		status.innerText = `${friend.isOnline === true ? 'online' : 'offline'}`;
		status.className = `text-xs font-[Inter] ${friend.isOnline === true ? 'text-green-500' : 'text-red-500'}`
		text.appendChild(name);
		text.appendChild(status);
		// ===========================


		// actions ===================
		// === Delete button ===
		const actions = document.createElement('div');
		actions.className = 'flex flex-row justify-center items-center';
		const deleteBtn = document.createElement('button');
		deleteBtn.innerHTML = /*html*/`
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-7 stroke-1 stroke-red-500 fill-none hover:stroke-white  hover:fill-red-500">
			<path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
			</svg>
		`;
		deleteBtn.id = `delete-${friend.id}`;
		actions.appendChild(deleteBtn);

		// ===========================

		card.appendChild(avatar);
		card.appendChild(text);
		card.appendChild(actions);

		deleteBtn.addEventListener('click', (e) => {
			 e.stopPropagation(); // prevent selecting friend when deleting
			// Get dialog elements
			const dialog = this.querySelector('#delete-friend-dialog') as HTMLDialogElement;
			const message = this.querySelector('#delete-friend-message') as HTMLElement;
			const cancelBtn = this.querySelector('#cancel-delete-btn') as HTMLButtonElement;
			const confirmBtn = this.querySelector('#confirm-delete-btn') as HTMLButtonElement;
			
			if (!dialog) return;
			
			// Update message with friend name
			if (message) {
				message.textContent = `Are you sure you want to remove ${friend.displayName} from your friends?`;
			}
			
			// Show dialog
			dialog.showModal();
			
			// Handle cancel
			const handleCancel = () => {
				dialog.close();
				cancelBtn?.removeEventListener('click', handleCancel);
				confirmBtn?.removeEventListener('click', handleConfirm);
			};
			
			// Handle confirm
			const handleConfirm = () => {
				dialog.close();
				this.dispatchEvent(new CustomEvent('event-delete-friend', {
					detail: {
						friendshipId: friend.friendshipId as string
					},
					bubbles: true
				}));
				cancelBtn?.removeEventListener('click', handleCancel);
				confirmBtn?.removeEventListener('click', handleConfirm);
			};
			
			// Attach event listeners
			cancelBtn?.addEventListener('click', handleCancel);
			confirmBtn?.addEventListener('click', handleConfirm);
			
			// Close on backdrop click
			dialog.addEventListener('click', (e) => {
				if (e.target === dialog) {
					handleCancel();
				}
			});
		});

		// Dispatch event when user clicks this friend
		card.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('friend-selected', {
				detail: friend,
				bubbles: true
			}));
		});
		
		return card;
	}
}

customElements.define('friend-list', FriendList);


