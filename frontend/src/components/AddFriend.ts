import { AppContext } from "../types.js";
import { BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { escapeHtml } from "../pages/LiveChat.js";

export class AddFriend extends HTMLElement {
	private _ctx: AppContext | null = null;
	
	constructor() {
		super();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
		this.render();
		this.sendFriendshipRequest();
	}

	async connectedCallback() {
		this.render();
		this.sendFriendshipRequest();
	}

	private render() {
		this.innerHTML = 
		/*html*/`
			<h1 class='mb-5'>Add a new friend</h1>
			<form id='add-friend-form' class='flex gap-5 items-center justify-between'>
				<div class='flex flex-1'>
					<input id="friend-name-input" type="text" name="friend_name" placeholder="friend username" class="block w-full rounded-md px-3 py-1.5 text-stone-900 outline outline-1 -outline-offset-1 outline-medium placeholder:text-stone-400 focus:outline-2 focus:-outline-offset-2 focus:outline-muted sm:text-sm/6" />
				</div>
				<button id='add-friend-btn' type='submit' class='${BUTTON_WHITE_CLASSES}'>Add</button>
			</form>
			<p id='add-friend-message'></p>
		`;
	}

	private sendFriendshipRequest(): void {
		const form = document.getElementById('add-friend-form') as HTMLFormElement;
		const input = this.querySelector('#friend-name-input') as HTMLInputElement;
		form?.addEventListener('submit', (e) => {
			e.preventDefault();
			const formData = new FormData(form);
			const friendName: string = escapeHtml(formData.get('friend_name') as string);
			if (!friendName || friendName == '') {
				const errorMsg = this.querySelector('#add-friend-message') as HTMLParagraphElement;
				errorMsg.className = 'text-red-500 text-sm mt-2';
				errorMsg.innerText = 'Please enter a valid user name';
			}
			this.dispatchEvent(new CustomEvent('event-send-friendship-request', {
				detail: {
					friendName: friendName as string
				},
				bubbles: true
			}))
			input.value = '';
		})
	}

}

customElements.define('add-friend', AddFriend);


