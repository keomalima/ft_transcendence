import { AppContext } from "../types.js";
import type { GameData, GameUsers, TournamentData, TournamentParticipant } from "../types.js";
import { BUTTON_BLACK_CLASSES } from "../styles/tailwindStyles.js";
import { API_BASE_URL } from "../config.js";

export class PlayerList extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _gameData: GameData | null = null;
	private _gamePlayers: GameUsers[] | null = null;
	private _isCreator: boolean | null = false;
	private _uploadsUrl: string = API_BASE_URL;

	constructor() {
		super();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
	}

	set isCreator(value: boolean | null) {
		this._isCreator = value;
		if (this.isConnected && this._gamePlayers && this._gamePlayers && this._isCreator !== null) {
			this.loadAndRender();
		}
	}

	set gameData(value : GameData | null)
	{
		this._gameData = value;
		if (value)
			this._gamePlayers = value.gameUsers;
		if (this.isConnected && this._gamePlayers && this._gamePlayers && this._isCreator !== null) {
			this.loadAndRender();
		}
	}

	async connectedCallback() {
		if (this.isConnected && this._gamePlayers && this._gamePlayers && this._isCreator !== null) {
			await this.loadAndRender();
		}
	}

	private async loadAndRender() {
		this.render();
		this.displayPlayerCards();
		this.attachEventListener();
	}

	private render() {
		if (!this._gamePlayers) {
			this.innerHTML =
			/*html*/`
				<div class='h-full flex flex-col'>
					<h1 class='mb-5'>Players connected</h1>
					<p>Waiting for friend to join the game</p>
				</div>
			`;
		} else {
			this.innerHTML =
			/*html*/`
				<div class='h-full flex flex-col'>
					<h1 class='mb-5'>Players connected ${this._gameData?.gameUsers?.length}/2</h1>
					<div id='player-cards' class='flex-1 overflow-auto'></div>
					<div class='flex flex-1 flex-col mt-5 justify-center place-items-center gap-2'>
						<button id='start-game-button'
							${this._isCreator === false ? "hidden" : ""} 
							${this._gameData?.gameUsers?.length !== 2 ? "hidden" : ""} 
							class=' w-full lg:w-1/3 min-w-30 place-items-center font-[Calistoga] px-3.5 py-2.5 rounded-full bg-black text-white outline outline-1 outline-black hover:shadow-md
								disable:opacity-75
								enabled:hover:font-semibold
								focus-visible:outline-2 focus-visible:outline-offset-2'>
							START
						</button>
						<button id='quit-game-button' class='w-full lg:w-1/3 min-w-30 place-items-center font-[Calistoga] px-3.5 py-2.5 rounded-full bg-white text-black outline outline-1 outline-black hover:shadow-md hover:font-semibold'>
							QUIT
						</button>
					</div>
					<p id='error-start-game'></p>
				</div>
			`;
		}
	}

	private displayPlayerCards(): void {
		const playerCards = document.getElementById('player-cards');
		if (playerCards && this._gamePlayers)
		{
			this._gamePlayers.forEach((player) => {
				playerCards.appendChild(this.createPlayerCard(player));
			});
		}
	}

	private createPlayerCard(player: Partial<GameUsers>): HTMLElement {

		const card = document.createElement('div');
		card.className = 'relative flex items-center bg-stone-100 rounded space-x-3 my-2 py-2 px-3';

		// profile picture ===========
		const avatar = document.createElement('div');
		avatar.className = 'shrink-0';

		const image = document.createElement('img');
		if (player.user?.avatarUrl)
			image.src = `${this._uploadsUrl}${player.user.avatarUrl}`;
		image.className = 'w-10 h-10 bg-gray-300 rounded-full object-cover';
		avatar.appendChild(image);
		// ===========================


		// text content ==============
		const text = document.createElement('div');
		text.className = 'min-w-0 flex-1 pl-3 text-[Inter]';

		const name = document.createElement('p');
		name.innerText = `${player.user?.displayName}`;
		if (this._ctx?.userStore.get()?.id === player.user?.id) {
			name.className = 'text-sm font-[Inter] font-semibold'
		} else {
			name.className = 'text-sm font-[Inter]'
		}


		text.appendChild(name);
		// ===========================


		// actions ===================
		const actions = document.createElement('div');
		const removeBtn = document.createElement('button');
		removeBtn.className = 'font-[Inter] rounded-full px-2 py-1 text-xs text-red-500 outline outline-1 outline-red-500 hover:bg-red-500 hover:text-white';
		removeBtn.innerText = 'remove';
		removeBtn.id = `remove-${player.user?.id}`;
		if (this._isCreator === true && this._ctx?.userStore.get()?.id != player.user?.id) {
			actions.appendChild(removeBtn);
		}
		// ===========================

		card.appendChild(avatar);
		card.appendChild(text);
		card.appendChild(actions);

		removeBtn.addEventListener('click', (e) => {
			e.preventDefault();
			//console.log('remove triger');
			this.dispatchEvent(new CustomEvent('event-remove-player', {
				detail: {
					gameId: this._gameData?.id as string,
					playerId: player.user?.id as string
				},
				bubbles: true
			}));
		});

		return card;
	}

	// ======== EVENT LISTENER ============

	private attachEventListener() {

		// **** START GAME ****
		const startBtn = this.querySelector('#start-game-button') as HTMLButtonElement;
		startBtn.addEventListener('click', (e) => {
			e.preventDefault();
			this.dispatchEvent(new CustomEvent('event-start-game', {
				detail: this._gameData?.id,
				bubbles: true
			}));
		});

		// **** QUIT GAME ****
		const quitBtn = this.querySelector('#quit-game-button') as HTMLButtonElement;
		quitBtn.addEventListener('click', (e) => {
			e.preventDefault();
			this.dispatchEvent(new CustomEvent('event-quit-game', {
				detail: this._gameData?.id,
				bubbles: true
			}));
		});
	}
}

customElements.define('player-list', PlayerList);
