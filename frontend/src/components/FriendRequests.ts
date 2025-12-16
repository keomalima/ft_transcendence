import { friendshipApi } from "../api/friendshipApi.js";
import { AppContext } from "../types.js";
import type { RequestData } from "../types.js";

export class FriendRequests extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _list: Partial<RequestData>[] | null = null;
	private _uploadsUrl: string = 'http://localhost:3000';
	private _isLoading: boolean = false;
	
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
		if (this._ctx && !this._isLoading) {
			await this.loadAndRender();
		}
	}

	public async loadAndRender() {
		if (this._isLoading) return;
		this._isLoading = true;
		
		await this.getRequests();
		this.render();
		this.displayFriendCards();
		
		this._isLoading = false;
	}

	private render() {
		this.innerHTML = 
		/*html*/`
			<div class='h-full flex flex-col'>
				<h1 class='mb-5'>Requests</h1>
				<div id='requests-list' class='flex-1 overflow-auto'></div>
			</div>

			<!-- Confirmation Dialog -->
			<dialog id="reject-friend-dialog" class="rounded-lg shadow-lg p-6 backdrop:bg-black backdrop:bg-opacity-50">
				<div class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold">Reject request</h2>
					<p id="reject-friend-message" class="text-gray-600">Are you sure you want to reject this friendship request?</p>
					<div class="flex gap-3 justify-end">
						<button id="cancel-reject-btn" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
						<button id="confirm-reject-btn" class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white">Delete</button>
					</div>
				</div>
			</dialog>
		`;
	}

	private async getRequests(): Promise<void> {
		try {
			this._list = await friendshipApi.getRequests();
		} catch(error) {
			console.log(error);
		}
	}

	private displayFriendCards(): void {
		const requestsCards = document.getElementById('requests-list');
		if (requestsCards)
		{
			this._list?.forEach((friend) => {
				requestsCards.appendChild(this.createRequestCard(friend));
			});
		}
	}

	private createRequestCard(request: Partial<RequestData>): HTMLElement {

		const card = document.createElement('div');
		card.className = 'relative flex items-center bg-stone-100 rounded space-x-3 my-2 py-2 px-3';

		// profile picture ===========
		const avatar = document.createElement('div');
		avatar.className = 'shrink-0';

		const image = document.createElement('img');
		image.src = `${this._uploadsUrl}${request.friend?.avatarUrl}`;
		image.className = 'w-10 h-10 bg-gray-300 rounded-full object-cover';
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
		actions.classList = 'flex flex-row gap-3 justify-center items-center'
		const acceptBtn = document.createElement('button');
		acceptBtn.innerHTML = /*html*/`
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-7 stroke-1 stroke-green-500 fill-none hover:stroke-white  hover:fill-green-500">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
			</svg>
		`;
		acceptBtn.id = `accept-${request.friend?.id}`;
		const rejectBtn = document.createElement('button');
		rejectBtn.innerHTML = /*html*/`
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-7 stroke-1 stroke-red-500 fill-none hover:stroke-white  hover:fill-red-500">
			<path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
			</svg>
		`;
		rejectBtn.id = `reject-${request.friend?.id}`;
		actions.appendChild(acceptBtn);
		actions.appendChild(rejectBtn);
		// ===========================

		card.appendChild(avatar);
		card.appendChild(text);
		card.appendChild(actions);

		acceptBtn.addEventListener('click', async (e) => {
			this.dispatchEvent(new CustomEvent('event-accept-friend', {
				detail: {
					requestId: request.id as string,
				},
				bubbles: true
			}));
		});

		rejectBtn.addEventListener('click', async (e) => {
			// Get dialog elements
			const dialog = this.querySelector('#reject-friend-dialog') as HTMLDialogElement;
			const message = this.querySelector('#reject-friend-message') as HTMLElement;
			const cancelBtn = this.querySelector('#cancel-reject-btn') as HTMLButtonElement;
			const confirmBtn = this.querySelector('#confirm-reject-btn') as HTMLButtonElement;
			
			if (!dialog) return;
			
			// Update message with friend name
			if (message) {
				message.textContent = `Are you sure you want to reject ${request.friend?.displayName} request?`;
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
				this.dispatchEvent(new CustomEvent('event-reject-friend', {
					detail: {
						requestId: request.id as string
					},
					bubbles: true
				}));
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


		


		return card;
	}
}

customElements.define('requests-list', FriendRequests);
