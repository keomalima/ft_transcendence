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
		const userBlocked = friend.isBlocked;    // user blocked the friend
		const userBeBlocked = friend.isBlockedBy; // user be blocked by the friend

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

		// === Block / Unblock Button ===
		const blockBtn = document.createElement('button');
		blockBtn.id = `block-${friend.id}`;
		blockBtn.className = 'ml-2';
		blockBtn.title = userBlocked
			? "Unblock your friend"
			: "Block your friend";

		blockBtn.innerHTML = /*html*/`
		<div class="relative w-8 h-8">
			<!-- Down-left arrow -->
			<svg viewBox="0 0 24 24" class="w-8 h-8 text-blue-600 rotate-[-30deg]">
				<path fill="currentColor" d="M12 21c-.39 0-.77-.15-1.06-.44l-6.5-6.5a1.5 1.5 0 1 1 2.12-2.12L11 16.88V3a1.5 1.5 0 1 1 3 0v13.88l4.44-4.44a1.5 1.5 0 1 1 2.12 2.12l-6.5 6.5c-.29.29-.67.44-1.06.44z"/>
			</svg>
			<!-- ✅ or ❌ badge -->
			<span class="absolute -bottom-0.5 -right-0.5 rounded-full w-2 h-2 ${userBlocked ? 'bg-red-500' : 'bg-green-500'}">
			</span>
		</div>
		`;
		actions.appendChild(blockBtn);


		// === Blocked-by Status Icon ===
		const blockedStatus = document.createElement('div');
		blockedStatus.className = 'ml-2';
		blockedStatus.title = userBeBlocked
			? "You are blocked by this friend"
			: "You can message this friend";

		blockedStatus.innerHTML = /*html*/`
		<div class="relative w-8 h-8">
			<!-- Up-right arrow -->
			<svg viewBox="0 0 24 24" class="w-8 h-8 text-blue-600 rotate-[30deg]">
				<path fill="currentColor" d="M12 3c.39 0 .77.15 1.06.44l6.5 6.5a1.5 1.5 0 1 1-2.12 2.12L13 7.12V21a1.5 1.5 0 1 1-3 0V7.12l-4.44 4.44a1.5 1.5 0 1 1-2.12-2.12l6.5-6.5c.29-.29.67-.44 1.06-.44z"/>
			</svg>
			<!-- ✅ or ❌ badge -->
			<span class="absolute -bottom-0.5 -right-0.5 rounded-full w-2 h-2 ${userBeBlocked ? 'bg-red-500' : 'bg-green-500'}">
			</span>
		</div>
		`;
		actions.appendChild(blockedStatus);



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

		// Dispatch event when user clicks this friend
		card.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('friend-selected', {
				detail: friend,
				bubbles: true
			}));
		});
		
		blockBtn?.addEventListener('click', (e) => {
			e.stopPropagation(); // prevent triggering card click

			this.dispatchEvent(new CustomEvent('event-toggle-block', {
				detail: {
					friendId: friend.id as string,
					isBlocked: userBlocked
				},
				bubbles: true
			}));
		});

		return card;
	}
}

customElements.define('friend-list', FriendList);


