import { friendshipApi } from "../api/friendshipApi.js";
import { AppContext } from "../types.js";
import type { FriendData } from "../types.js";
import type { RequestData } from "../types.js";

export class FriendRequests extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _list: Partial<RequestData>[] | null = null;
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
	}

	public async loadAndRender() {
		await this.getRequests();
		this.render();
		this.displayFriendCards();
	}

	private render() {
		this.innerHTML = 
		/*html*/`
			<div class='h-full flex flex-col'>
				<h1 class='mb-5'>Requests</h1>
				<div id='requests-list' class='flex-1 overflow-auto'></div>
			</div>
		`;
	}

	private async getRequests(): Promise<void> {
		const currentUser = this._ctx?.userStore.get();
		const token = currentUser?.accessToken;
		if (token !== undefined)
			this._accessToken = token;
		if (!this._accessToken)
			return;
		try {
			this._list = await friendshipApi.getRequests(this._accessToken);
		} catch(error) {
			console.log(error);
		}
	}

	private displayFriendCards(): void {
		if (!this._accessToken)
			return;
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
		// if (request?.friend?.avatarUrl)
		// 	image.src = `http://localhost:3000/${friend.avatarUrl}`;
		image.src = '/src/images/ProfilePictureSquared.png';
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
		acceptBtn.className = 'font-[Inter] rounded-full px-2 py-1 text-xs text-green-500 outline outline-1 outline-green-500 hover:bg-green-500 hover:text-white';
		acceptBtn.innerText = '+';
		acceptBtn.id = `accept-${request.friend?.id}`;
		actions.appendChild(acceptBtn);
		// ===========================

		card.appendChild(avatar);
		card.appendChild(text);
		card.appendChild(actions);

		acceptBtn.addEventListener('click', async (e) => {
			console.log('event accept friend ', request.friend?.name);
			this.dispatchEvent(new CustomEvent('event-accept-friend', {
				detail: {
					requestId: request.id as string,
					accessToken: this._accessToken as string
				},
				bubbles: true
			}));
		});

		return card;
	}
}

customElements.define('requests-list', FriendRequests);
