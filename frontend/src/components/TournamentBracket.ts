import { AppContext, TournamentData, TournamentGame } from "../types.js";

export class TournamentBracket extends HTMLElement {
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
			this.loadAndRender();
		}
	}

	private async loadAndRender() {
		this.render();
		this.displayMatchCards();
	}

	private render() {
		const rounds = this._tournamentData?.totalRounds ? (this._tournamentData.totalRounds * 2) - 1 : 1;
		this.innerHTML = /*html*/`
			<div class='h-full flex flex-col'>
				<h1 class='mb-5'>Tournament state</h1>
				<div id='match-cards' class='grid grid-cols-[repeat(${rounds ?? 1},_minmax(0,1fr))] gap-8'></div>
			</div>

		`;
	}

	private displayMatchCards(): void {
		const matchCards = document.getElementById('match-cards');
		const rounds = this._tournamentData?.totalRounds ?? 1;
		
		if (!matchCards || !this._tournamentGamesData || !this._tournamentData) {
			return;
		}
		
		for (let i = 1; i <= rounds; i++) {
			const gamesInRound = Math.pow(2, rounds - i);
			
			for (let j = 1; j <= gamesInRound; j++) {
				const colNumber = this.getColumnIndex(j, i, gamesInRound);
				const game = this.findGame(i, j);
				
				const card = game ? this.createMatchCard(game) : this.createEmptyCard();
				card.style.gridColumn = `${colNumber}`;
				matchCards.appendChild(card);
			}
		}
	}

	private findGame(roundNbr: number, matchNbr: number): TournamentGame | undefined {
		return this._tournamentGamesData?.find(
			game => game.roundNumber === roundNbr && game.matchNumber === matchNbr
		);
	}

	private getColumnIndex(gameIndex: number, roundIndex: number, gamesInRound: number) : number {
		const roundTotal = this._tournamentData? this._tournamentData.totalRounds : 1;
		const totalColumns = (roundTotal * 2) - 1;

		if (roundIndex === roundTotal) {
			return roundTotal;
		}

		const gamesPerSide = gamesInRound/2;

		if (gameIndex <= gamesPerSide) {
			return roundIndex;
		}
		return totalColumns - roundIndex + 1;
	}

	private createMatchCard(game: TournamentGame): HTMLElement {
		const card = document.createElement('div');
		card.className = 'flex flex-col gap-4';

		game.gameUsers.forEach((player) => {
			const avatar = document.createElement('div');
			avatar.className = 'shrink-0';
	
			const image = document.createElement('img');
			image.src = `${this._imageUrl}${player.user.avatarUrl}`;
			image.className = 'w-10 h-10 bg-gray-300 rounded-full object-cover';
			avatar.appendChild(image);
	
			// text content ==============
			const text = document.createElement('div');
			text.className = 'min-w-0 flex-1 pl-3 text-[Inter]';
	
			const name = document.createElement('p');
			name.innerText = `${player.user.displayName}`;
			name.className = 'text-sm font-[Inter]'
	
			text.appendChild(name);
			// ===========================
	
			card.appendChild(avatar);
			card.appendChild(text);
		})
		return card;
	}
	
	private createEmptyCard(): HTMLElement {
		const card = document.createElement('div');
		card.className = 'flex flex-col gap-4';

		for (let i = 0; i < 2; i++) {
			const avatar = document.createElement('div');
			avatar.className = 'shrink-0';
	
			const image = document.createElement('div');
			image.className = 'w-10 h-10 bg-gray-300 rounded-full object-cover';
			avatar.appendChild(image);
	
			// text content ==============
			const text = document.createElement('div');
			text.className = 'min-w-0 flex-1 pl-3 text-[Inter]';
	
			const name = document.createElement('p');
			name.innerText = `player ${i}`;
			name.className = 'text-sm font-[Inter]'
	
			text.appendChild(name);
			// ===========================
	
			card.appendChild(avatar);
			card.appendChild(text);
		}
		return card;
	}
}

customElements.define('tournament-bracket', TournamentBracket);