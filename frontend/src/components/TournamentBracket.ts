import { tournamentApi } from "../api/tournamentApi.js";
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

	// Total columns = (totalRounds × 2) - 1
	// For 8 players (3 rounds): 5 columns
	// Left bracket: columns 1, 2
	// Final: column 3 (center)
	// Right bracket: columns 4, 5 (mirrored)

	// Divide games into three sections:
	// Left bracket: Games from rounds 1 to (totalRounds - 1)
	// Final: Game from round totalRounds
	// Right bracket: Games from rounds (totalRounds - 1) down to 1
	
	// Column assignment:
	// Left bracket: column = roundNumber
	// Final: column = totalRounds
	// Right bracket: column = (totalRounds × 2) - roundNumber
	
	// Row positioning (vertical spacing):
	// Round 1: games are evenly spaced
	// Round 2: games are centered between their parent games from round 1
	// Each subsequent round: games are centered between pairs of games from the previous round
	// Use increasing row gaps as rounds progress (e.g., gap = 2^(roundNumber-1))
	// Game ordering within each round:
	
	// Use matchNumber to determine vertical position
	// Calculate row offset based on round and match number

	// card.style.gridColumn = `${columnNumber}`;

	private displayMatchCards(): void {
		const matchCards = document.getElementById('match-cards');
		if (matchCards && this._tournamentGamesData && this._tournamentData) {
			this._tournamentGamesData.forEach((game) => {
				matchCards.appendChild(this.createMatchCard(game));
			})
		}
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