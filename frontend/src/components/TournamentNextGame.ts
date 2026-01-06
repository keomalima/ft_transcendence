import { AppContext, TournamentData, TournamentGame, UserState } from "../types.js";

export class TournamentNextGame extends HTMLElement {
	private _tournamentData: TournamentData | null = null;
	private _tournamentGamesData: TournamentGame[] | null = null;
	private _imageUrl: string = 'http://localhost:3000';
	private _ctx: AppContext | null = null;

	constructor() {
		super();
		this.render();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
	}

	set tournamentGamesData(value : TournamentGame[] | null) {
		this._tournamentGamesData = value;
		if (value){
			this.loadAndRender();
		}
	}

	set tournamentData(value: TournamentData | null) {
		this._tournamentData = value;
		if (value) {
			console.log('valueeee', value);
			this.loadAndRender();
		}
	}

	private async loadAndRender() {
		this.render();
		this.displayNextGameCard();
	}

	private render() {
		this.innerHTML = /*html*/`
			<div class="flex w-full overflow-x-auto py-8 font-sans">
			  <div id='next-game' class="mx-auto flex w-max items-center gap-10 px-4"></div>
			</div>
		`;
	}

	private displayNextGameCard(): void {
		const currentUser = this._ctx?.userStore.get();
		const nextMatchCardContainer = document.getElementById('next-game');
		if (!nextMatchCardContainer || !this._tournamentData || !currentUser) return;
	
		nextMatchCardContainer.innerHTML = '';
		nextMatchCardContainer.className = 'flex flex-row gap-10 px-4 w-max mx-auto';

		const column = document.createElement('div');
		column.className = 'flex flex-col gap-8';
		const nextGame = this.findNextGame(currentUser);
		if (nextGame) {
			const card = this.createNextMatchCard(nextGame, currentUser);
			column.append(card);
		} else {
			const card = this.createEmptyNextMatchCard()
			column.append(card);
		}
		nextMatchCardContainer.appendChild(column);
	}

	private findNextGame(currentUser: UserState): TournamentGame | undefined {
		let nextGame: TournamentGame | undefined;
	    this._tournamentGamesData?.forEach(game => {
			if (!nextGame && game.status === 'PENDING') {
				if (game.gameUsers.some(gameUser => gameUser.user.id === currentUser.id)) {
					nextGame = game; 
				}
			}
		});
		return nextGame;
	}

	private createNextMatchCard(nextGame: TournamentGame, currentUser: UserState): HTMLElement {
		const card = document.createElement('div');
		card.className = `flex w-[32rem] items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-md`;

		const player = nextGame.gameUsers.find(game => game.user.id === currentUser.id);
		const opponent = nextGame.gameUsers.find(game => game.user.id !== currentUser.id);
		if (!opponent || !player) return card;

		// Left Side: Opponent Info
		const infoContainer = document.createElement('div');
		infoContainer.className = 'flex items-center gap-4';

		// Avatar
		const avatar = document.createElement('img');
		avatar.src = `${this._imageUrl}${opponent.user.avatarUrl}`;
		avatar.className = 'h-16 w-16 rounded-full border-2 border-indigo-50 object-cover shadow-sm';
		infoContainer.appendChild(avatar);

		// Text Info
		const textContainer = document.createElement('div');
		textContainer.className = 'flex flex-col';

		const header = document.createElement('span');
		header.className = 'text-xs font-bold uppercase tracking-widest text-gray-400';
		header.innerText = 'Next Opponent';
		textContainer.appendChild(header);

		// Name
		const name = document.createElement('h3');
		name.innerText = opponent.user.displayName;
		name.className = 'text-lg font-bold text-gray-800';
		textContainer.appendChild(name);

		// Status Badge
		const statusBadge = document.createElement('div');
		statusBadge.className = `mt-1 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
			opponent.isReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
		}`;
		statusBadge.innerHTML = `<div class="h-1.5 w-1.5 rounded-full ${opponent.isReady ? 'bg-green-500' : 'bg-gray-400'}"></div>${opponent.isReady ? 'Ready' : 'Not Ready'}`;
		textContainer.appendChild(statusBadge);

		infoContainer.appendChild(textContainer);
		card.appendChild(infoContainer);

		// Right Side: Actions
		const actionContainer = document.createElement('div');
		actionContainer.className = 'flex flex-col items-center gap-2';

		const readyBtn = document.createElement('button');
		readyBtn.innerText = 'Ready';
		readyBtn.disabled = player.isReady ? true : false;
		readyBtn.className = 'rounded-lg bg-stone-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 disabled:bg-creamgrey disabled:text-medium disabled:cursor-not-allowed disabled:hover:bg-creamgrey';
		actionContainer.appendChild(readyBtn);

		const statusText = document.createElement('span');
		statusText.innerText = 'Waiting opponent';
		statusText.className = player.isReady ? 'text-xs text-gray-500' : 'hidden';
		actionContainer.appendChild(statusText);

		card.appendChild(actionContainer);

		readyBtn.addEventListener('click', (e) => {
			e.preventDefault();
			this.dispatchEvent(new CustomEvent('event-start-tournament-game', {
				detail: {	
					game: nextGame,
					playerId: currentUser.id as string,
				},
				bubbles: true
			}));
		});

		return card;
	}

	private createEmptyNextMatchCard(): HTMLElement {
		const card = document.createElement('div');
		card.className = `flex w-[32rem] items-center justify-between rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6`;

		// Left Side: Placeholder Info
		const infoContainer = document.createElement('div');
		infoContainer.className = 'flex items-center gap-4 opacity-50';

		// Avatar Placeholder
		const avatar = document.createElement('div');
		avatar.className = 'h-16 w-16 rounded-full bg-gray-200';
		infoContainer.appendChild(avatar);

		// Text Info
		const textContainer = document.createElement('div');
		textContainer.className = 'flex flex-col';

		const header = document.createElement('span');
		header.className = 'text-xs font-bold uppercase tracking-widest text-gray-400';
		header.innerText = 'Next Opponent';
		textContainer.appendChild(header);

		// Name Placeholder
		const name = document.createElement('h3');
		name.innerText = 'TBD';
		name.className = 'text-lg font-bold text-gray-500';
		textContainer.appendChild(name);

		// Status Badge Placeholder
		const statusBadge = document.createElement('div');
		statusBadge.className = 'mt-1 flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-400';
		statusBadge.innerHTML = '<div class="h-1.5 w-1.5 rounded-full bg-gray-400"></div>Waiting';
		textContainer.appendChild(statusBadge);

		infoContainer.appendChild(textContainer);
		card.appendChild(infoContainer);

		// Right Side: Actions Placeholder
		const actionContainer = document.createElement('div');
		actionContainer.className = 'flex flex-col items-center gap-2 opacity-50';

		const readyBtn = document.createElement('button');
		readyBtn.innerText = 'Ready';
		readyBtn.disabled = true;
		readyBtn.className = 'cursor-not-allowed rounded-lg bg-gray-300 px-5 py-2 text-sm font-semibold text-white shadow-sm';
		actionContainer.appendChild(readyBtn);

		const statusText = document.createElement('span');
		statusText.innerText = 'Waiting for opponent';
		statusText.className = 'text-xs text-gray-400';
		actionContainer.appendChild(statusText);

		card.appendChild(actionContainer);

		return card;
	}
}

customElements.define('tournament-next-game', TournamentNextGame);