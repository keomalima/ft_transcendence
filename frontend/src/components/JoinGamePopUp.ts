import { router } from "../main.js";
import { INPUT_CLASSES, BUTTON_BLACK_CLASSES } from "../styles/tailwindStyles.js";
import { AppContext } from "../types.js";

export class JoinGamePopUp extends HTMLElement {
	private selectedAvatarFile: File | null = null;
	private _ctx: AppContext | null = null;

	constructor() {
		super();
		this.render();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
		this.attachEventListener(this._ctx);
	}

	private render() {
		this.innerHTML = /*html*/`
			<div>
				<button onclick="this.closest('dialog').close()" class="outline-none float-right p-10">X</button>
			</div>
			<div class="px-6 py-12 sm:rounded-lg sm:px-12">
				<h1 class="mb-10 text-xl">Join a game</h1>
				<form action="/" method="POST" id='join-game-form' class="md:col-span-2">
					<div class='flex flex-1 flex-row gap-10'>
						<div class='flex flex-1 flex-col'>
							<label class='text-sm text-medium' for="game_token">Enter game token to join the game</label>
							<input id="game-token" type="text" name="game_token" autoComplete="token" class='${INPUT_CLASSES}'/>
						</div>
						<button type='submit' class='${BUTTON_BLACK_CLASSES}'>LET'S GO</button>
					</div>
				</form>
				<p id='error-join-game'></p>
			</div>

        `;
	}

	
	
	// ======== EVENT LISTENER ============

	private attachEventListener(ctx: AppContext | null) {

		if (ctx == null)
			return;

		const form = this.querySelector('#join-game-form') as HTMLFormElement;
		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			const input = this.querySelector('input[name="game_token"') as HTMLInputElement;
			const token = input.value;
			this.dispatchEvent(new CustomEvent ('event-join-game', {
				detail: token,
				bubbles: true
			}))
		})
	}


}

customElements.define('join-game-pop-up', JoinGamePopUp);