import { API_BASE_URL } from "../config.js";
import { AppContext, GameHistory } from "../types.js";

export class MatchHistory extends HTMLElement {

	private _ctx: AppContext | null = null;
	private _gameHistory: GameHistory[] | null = null;
	private _uploadsUrl: string = API_BASE_URL;
	private _isLoading: boolean = false;

	constructor() {
		super();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
		if (this.isConnected && this._ctx && this._gameHistory)
			this.loadAndRender();
	}
	set gameHistory(value: GameHistory[]) {
		this._gameHistory = value;
		if (this.isConnected && this._ctx && this._gameHistory)
			this.loadAndRender();
	}

	connectedCallback() {
		if (this.isConnected && this._ctx && this._gameHistory && !this._isLoading)
			this.loadAndRender();
	}

	private async loadAndRender() {
		if (this._isLoading) return;
		this._isLoading = true;
		
		this.render();
		this.generateMatchHistory();
		
		this._isLoading = false;
	}

	private render() {
		let onlineGames = 0;
		this._gameHistory?.map((game) => {
			if (game.type != 'LOCAL')
				onlineGames++;
		})
		if (this._gameHistory?.length == 0 || onlineGames === 0) {
			this.innerHTML =
			/*html*/`
				<h1 class='flex-none'>Online and tournament match history</h1>
				<div class="flex-1 overflow-auto min-h-0 flex items-center justify-center">
					<div class="text-center py-12 px-4">
						<!-- Icon/Illustration -->
						<svg class="w-24 h-24 mx-auto mb-6 text-gray-400 size-7 stroke-1 stroke-gray-300 fill-none" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						
						<!-- Message -->
						<h3 class="text-xl font-semibold text-gray-700 mb-2">No matches yet</h3>
						<p class="text-gray-500 mb-6 max-w-sm mx-auto">
							Start your journey by playing your first online game! Your match history will appear here.
						</p>
					</div>
				</div>
			`
		} else {
		this.innerHTML =
			/*html*/`
				<h1 class='flex-none'>Online and tournament match history</h1>
				<div class="flex-1 overflow-auto min-h-0">
					<table class="w-full border-separate border-spacing-0">
						<thead>
							<tr>
							<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium bg-white sm:table-cell">opponent</th>
							<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium bg-white sm:table-cell">score</th>
							<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium bg-white sm:table-cell">winner</th>
							<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium bg-white hidden lg:table-cell">duration</th>
							<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium bg-white sm:table-cell">date</th>
							<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium bg-white sm:table-cell">mode</th>
							</tr>
						</thead>
						<tbody id='match-data'></tbody>
					</table>
				</div>
			`
		}

	}

	private generateMatchHistory() {
		const matchs = document.getElementById('match-data');

		this._gameHistory?.forEach((match) => {
			if (match.type === 'ONLINE' || match.type === 'TOURNAMENT')
				matchs?.appendChild(this.createMatchElem(match));
		})
	}

	private createMatchElem(match: GameHistory) : HTMLElement {

		const elem = document.createElement('tr');

		const profile = document.createElement('td');
		profile.className = 'border-b border-creamgrey px-3 py-4 text-sm font-medium whitespace-nowrap text-gray-900 flex flex-col justify-center items-center gap-2';

		const img = document.createElement('img');
		img.className = 'w-10 h-10 bg-gray-300 rounded-full shrink-0 object-cover';
		img.src = `${this._uploadsUrl}${match.opponent?.avatarUrl}`;

		const opponent = document.createElement('p');
		opponent.className = 'my-0';
		let opponentName = match.opponent?.name;
		if (opponentName && opponentName?.length > 15) {
			opponentName = `${opponentName.substring(0, 15)}...`;
		}
		opponent.innerHTML = `${opponentName}`;

		profile.appendChild(img);
		profile.appendChild(opponent);

		const score = document.createElement('td');
		score.className = 'border-b border-creamgrey px-3 py-4 text-sm whitespace-nowrap sm:table-cell text-center';
		score.innerHTML = `${match.score?.toString()} - ${match.opponent?.score?.toString()}`;

		const winner = document.createElement('td');
		winner.className = 'border-b border-creamgrey px-3 py-4 text-sm whitespace-nowrap sm:table-cell text-center';
		winner.innerHTML = `${match.isWinner? '⭐' : '-'}`;

		const duration = document.createElement('td');
		duration.className = 'border-b border-creamgrey px-3 py-4 text-sm whitespace-nowrap text-center hidden lg:table-cell';
		duration.innerHTML = `${match.duration} min`;

		const date = document.createElement('td');
		date.className = 'border-b border-creamgrey px-3 py-4 text-sm whitespace-nowrap text-center';
		date.innerHTML = `${match.date?.split('T')[0]}`;

		const mode = document.createElement('td');
		mode.className = 'border-b border-creamgrey py-4 pr-4 pl-3 text-sm whitespace-nowrap text-center';
		mode.innerHTML = `${match.type === 'ONLINE' ? '1 vs 1' : match.type}`;

		elem.appendChild(profile);
		elem.appendChild(score);
		elem.appendChild(winner);
		elem.appendChild(duration);
		elem.appendChild(date);
		elem.appendChild(mode);

		return elem;
	}
}

customElements.define('match-history', MatchHistory);
