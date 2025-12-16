import { friendshipApi } from "../api/friendshipApi.js";
import { AppContext } from "../types.js";
import type { FriendData } from "../types.js";

export class FriendList extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _list: Partial<FriendData>[] | null = null;
	private _uploadsUrl: string = 'http://localhost:3000';
	private _isLoading: boolean = false;
	
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
				<dialog id="delete-friend-dialog" class="rounded-lg shadow-lg p-6 backdrop:bg-black backdrop:bg-opacity-50">
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
		image.src = `${this._uploadsUrl}${friend.avatarUrl}`;
		image.className = 'w-10 h-10 bg-gray-300 rounded-full object-cover';
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

		// === Block / Unblock button ===
		const blockBtn = document.createElement('button');
		if (friend.isBlocked === true) {
			blockBtn.innerHTML = /*html*/`
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					class="pointer-events-none size-7">
					<path
						d="M4 4h16v12H6l-2 2v-2H4z"
						fill="white"
						stroke="black"
						stroke-width="1.5"
						stroke-linejoin="round"
					/>
					<line x1="4" y1="4" x2="20" y2="20"
						stroke="red" stroke-width="2"
					/>
				</svg>
		`;
		} else {
			blockBtn.innerHTML = /*html*/`
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
					class="pointer-events-none size-7">
					<path
						d="M4 4h16v12H6l-2 2v-2H4z"
						fill="white"
						stroke="black"
						stroke-width="1.5"
						stroke-linejoin="round"
					/>
				</svg>
		`;
		}
		blockBtn.title = friend.isBlocked ? "Unblock" : "Block";
		blockBtn.id = `block-${friend.id}`;
		blockBtn.className = 'ml-2';

		actions.appendChild(blockBtn);
		// ===========================

		card.appendChild(avatar);
		card.appendChild(text);
		card.appendChild(actions);

		deleteBtn.addEventListener('click', (e) => {
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

		blockBtn.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('event-toggle-block', {
				detail: {
					friendshipId: friend.friendshipId as string,
					isBlocked: friend.isBlocked === true
				},
				bubbles: true
			}));
		});

		
		return card;
	}
}

customElements.define('friend-list', FriendList);


