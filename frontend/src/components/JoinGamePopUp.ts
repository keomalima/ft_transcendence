import { INPUT_CLASSES, BUTTON_BLACK_CLASSES } from "../styles/tailwindStyles.js";
import { AppContext } from "../types.js";

export class JoinGamePopUp extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _type: 'game' | 'tournament' = 'game'; // Default to game

	constructor() {
		super();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
		this.attachEventListener(this._ctx);
	}

	set type(value: 'game' | 'tournament') {
		this._type = value;
		this.render();
	}

	connectedCallback() {
		this.render();
	}

	private render() {
		const title = this._type === 'game' ? 'Join a game' : 'Join a tournament';
		const label = this._type === 'game' 
			? 'Enter game token to join the game' 
			: 'Enter tournament token to join the tournament';
		
		this.innerHTML = /*html*/`
			<div>
				<button onclick="this.closest('dialog').close()" class="outline-none float-right p-10">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="px-6 py-12 sm:rounded-lg sm:px-12">
				<h1 class="mb-10 text-xl">${title}</h1>
				<form action="/" method="POST" id='join-form' class="md:col-span-2">
					<div class='flex flex-1 flex-row gap-10'>
						<div class='flex flex-1 flex-col'>
							<label class='text-sm text-medium' for="token-input">${label}</label>
							<input id="token-input" type="text" name="token" autoComplete="token" class='${INPUT_CLASSES}'/>
						</div>
						<button type='submit' class='${BUTTON_BLACK_CLASSES}'>LET'S GO</button>
					</div>
				</form>
				<p id='error-join-game'></p>
				<p id='error-join-tournament'></p>
			</div>

        `;
		
		// Re-attach event listener after render if context exists
		if (this._ctx) {
			this.attachEventListener(this._ctx);
		}
	}

	
	// ======== EVENT LISTENER ============

	private attachEventListener(ctx: AppContext | null) {

		if (ctx == null)
			return;

		const form = this.querySelector('#join-form') as HTMLFormElement;
		if (!form) return; // Guard in case render hasn't been called yet
		
		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			const input = this.querySelector('input[name="token"]') as HTMLInputElement;
			const token = input.value;
			
			// Dispatch different event based on type
			const eventName = this._type === 'game' ? 'event-join-game' : 'event-join-tournament';
			this.dispatchEvent(new CustomEvent(eventName, {
				detail: token,
				bubbles: true
			}))
		})
	}


}

customElements.define('join-game-pop-up', JoinGamePopUp);