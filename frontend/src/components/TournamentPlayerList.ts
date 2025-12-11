import { AppContext } from "../types.js";
import type { TournamentData, TournamentParticipant } from "../types.js";

export class TournamentPlayerList extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _tournamentData: TournamentData | null = null;
	private _participants: TournamentParticipant[] | null = null;
	private _isCreator: boolean | null = false;
	private _uploadsUrl: string = 'http://localhost:3000';

	constructor() {
		super();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
	}

	set isCreator(value: boolean | null) {
		this._isCreator = value;
		if (this.isConnected && this._participants && this._participants && this._isCreator !== null) {
			this.loadAndRender();
		}
	}

	set tournamentData(value : TournamentData | null)
	{
		this._tournamentData = value;
		if (value)
			this._participants = value.participants;
		if (this.isConnected && this._participants && this._participants && this._isCreator !== null) {
			this.loadAndRender();
		}
	}

	async connectedCallback() {
		if (this.isConnected && this._participants && this._participants && this._isCreator !== null) {
			await this.loadAndRender();
		}
	}

	private async loadAndRender() {
		this.render();
		this.displayPlayerCards();
		this.attachEventListener();
	}

	private render() {
		const maxPlayers = this._tournamentData?.numberPlayers || 4;
		const currentPlayers = this._participants?.length || 0;
		const isFull = currentPlayers === maxPlayers;
		
		if (!this._participants) {
			this.innerHTML =
			/*html*/`
				<div class='h-full flex flex-col'>
					<h1 class='mb-5'>Players connected</h1>
					<p>Waiting for players to join the tournament</p>
				</div>
			`;
		} else {
			this.innerHTML =
			/*html*/`
				<div class='h-full flex flex-col'>
					<h1 class='mb-5'>Players connected ${currentPlayers}/${maxPlayers}</h1>
					<div id='player-cards' class='flex-1 overflow-auto'></div>
					<div class='flex flex-1 flex-col mt-5 justify-center place-items-center gap-2'>
						<button id='start-tournament-button'
							${this._isCreator === false ? "hidden" : ""} 
							${isFull ? "hidden" : ""} 
							class=' w-full lg:w-1/3 min-w-30 place-items-center font-[Calistoga] px-3.5 py-2.5 rounded-full bg-black text-white outline outline-1 outline-black hover:shadow-md
								disable:opacity-75
								enabled:hover:font-semibold
								focus-visible:outline-2 focus-visible:outline-offset-2'>
							START
						</button>
						<button id='quit-tournament-button' class='w-full lg:w-1/3 min-w-30 place-items-center font-[Calistoga] px-3.5 py-2.5 rounded-full bg-white text-black outline outline-1 outline-black hover:shadow-md hover:font-semibold'>
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
		if (playerCards && this._participants)
		{
			this._participants.forEach((player) => {
				playerCards.appendChild(this.createPlayerCard(player));
			});
		}
	}

	private createPlayerCard(participant: TournamentParticipant): HTMLElement {

		const card = document.createElement('div');
		card.className = 'relative flex items-center bg-stone-100 rounded space-x-3 my-2 py-2 px-3';

		// profile picture ===========
		const avatar = document.createElement('div');
		avatar.className = 'shrink-0';

		const image = document.createElement('img');
		if (participant.user?.avatarUrl)
			image.src = `${this._uploadsUrl}${participant.user.avatarUrl}`;
		image.className = 'w-10 h-10 bg-gray-300 rounded-full object-cover';
		avatar.appendChild(image);
		// ===========================


		// text content ==============
		const text = document.createElement('div');
		text.className = 'min-w-0 flex-1 pl-3 text-[Inter]';

		const name = document.createElement('p');
		name.innerText = `${participant.user?.displayName}`;
		if (this._ctx?.userStore.get()?.id === participant.user.id) {
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
		removeBtn.id = `remove-${participant.user.id}`;
		console.log('Participant ', participant);
		if (this._isCreator === true && this._ctx?.userStore.get()?.id != participant.user.id) {
			actions.appendChild(removeBtn);
		}
		// ===========================

		card.appendChild(avatar);
		card.appendChild(text);
		card.appendChild(actions);

		removeBtn.addEventListener('click', (e) => {
			e.preventDefault();
			console.log('remove trigger');
			this.dispatchEvent(new CustomEvent('event-remove-player', {
				detail: {
					tournamentId: this._tournamentData?.id as string,
					playerId: participant.user.id as string
				},
				bubbles: true
			}));
		});

		return card;
	}

	// ======== EVENT LISTENER ============

	private attachEventListener() {

		// **** START GAME ****
		const startBtn = this.querySelector('#start-tournament-button') as HTMLButtonElement;
		startBtn.addEventListener('click', (e) => {
			e.preventDefault();
			this.dispatchEvent(new CustomEvent('event-start-tournament', {
				detail: this._tournamentData?.id,
				bubbles: true
			}));
		});

		// **** START GAME ****
		const quitBtn = this.querySelector('#quit-tournament-button') as HTMLButtonElement;
		quitBtn.addEventListener('click', (e) => {
			e.preventDefault();
			this.dispatchEvent(new CustomEvent('event-quit-tournament', {
				detail: this._tournamentData?.id,
				bubbles: true
			}));
		});
	}
}

customElements.define('tournament-player-list', TournamentPlayerList);
