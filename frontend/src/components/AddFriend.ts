import { AppContext } from "../types.js";
import { BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";

export class AddFriend extends HTMLElement {
	private _ctx: AppContext | null = null;
	
	constructor() {
		super();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
		// Load data when ctx is set and component is connected
		this.render();
		// if (this.isConnected) {
		// 	this.loadAndRender();
		// }
	}

	async connectedCallback() {
		// Load data if ctx is already set
		this.render();
		// if (this._ctx) {
		// 	await this.loadAndRender();
		// }
	}

	// private async loadAndRender() {
	// 	this.render();
	// }

	private render() {
		this.innerHTML = 
		/*html*/`
			<h1 class='mb-5'>Add a friend</h1>
			<form id='add-friend-form' class='flex items-center justify-between'>
				<div>
					<input id="friend-name" type="text" name="friend_name" placeholder="friend username" class="block w-full rounded-md px-3 py-1.5 text-stone-900 outline outline-1 -outline-offset-1 outline-medium placeholder:text-stone-400 focus:outline-2 focus:-outline-offset-2 focus:outline-muted sm:text-sm/6" />
				</div>
				<button id='add-friend-btn' type='submit' class='${BUTTON_WHITE_CLASSES}'>Add</button>
			</form>
		`;
	}

}

customElements.define('add-friend', AddFriend);


