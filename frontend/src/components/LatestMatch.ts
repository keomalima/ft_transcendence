import type { AppContext, GameHistory, UserState } from "../types.js";

export class LatestMatch extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _gameHistory: GameHistory[] | null = null;
	private _user: Partial<UserState> | null = null;
	
	constructor() {
		super();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
		if (this.isConnected && this._ctx && this._gameHistory && this._user)
			this.loadAndRender();
	}
	
	set user(value : Partial<UserState>)
	{
		this._user = value;
		if (this.isConnected && this._ctx && this._gameHistory && this._user)
			this.loadAndRender();
	}

	set gameHistory(value: GameHistory[]) {
		this._gameHistory = value;
		if (this.isConnected && this._ctx && this._gameHistory && this._user)
			this.loadAndRender();
	}

	connectedCallback() {
		if (this.isConnected && this._ctx && this._gameHistory && this._user)
			this.loadAndRender();
	}

	private async loadAndRender() {
		this.render();
		this.generateMatchCards();
	}	

	private render() {
		if (this._gameHistory?.length == 0) {
			this.innerHTML =
			/*html*/`
				<div class="col-span-4 sm:col-span-9 h-full">
					<div class="bg-white rounded-lg p-6 flex-1 flex-col h-full">
						<h1>Latest match scores</h1>
						<div class="flex-1 overflow-auto min-h-0 flex items-center justify-center">
							<div class="text-center py-12 px-4">
								<!-- Icon/Illustration -->
								<div class="w-20 h-20 mx-auto mb-6 text-gray-300">
									<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
											d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								
								<!-- Message -->
								<p class="text-gray-500 mb-6 max-w-sm mx-auto">No matches yet.</p>
							</div>
						</div>
					</div>
				</div>
			`
		} else {
			this.innerHTML = 
			/*html*/`
				<div class="col-span-4 sm:col-span-9">
					<div class="bg-white rounded-lg p-6">
						<h1>Latest match scores</h1>
						<div id='last-match-scores' class='mt-3 overflow-x-auto whitespace-nowrap p-5'>
							<span class='inline-grid grid-cols-1 grid-rows-3 mx-2 text-center'>
								<span class='p-5 text-white'>.</span>
								<span class='p-5 pl-0'>${this._user?.displayName}</span>
								<span class='p-5 pl-0'>opponent</span>
							</span>
						</div>
					</div>
				</div>
			`;
		}
	}

	private generateMatchCards() {
		//console.log('generate latest match', this._gameHistory);
		const scores = document.getElementById('last-match-scores');
		let count = 20;
		this._gameHistory?.forEach((match) => {
			if (count <= 0)
				return;
			scores?.appendChild(this.createScoreCard(match));
			count--;
		})
	}

	private createScoreCard(match: GameHistory) : HTMLElement {

		const textColor : string = match.isWinner ? 'bg-black text-white font-semibold' : 'bg-white';

		const card = document.createElement('span');
		card.className = 'inline-grid grid-cols-1 grid-rows-3 mx-2 rounded-xl text-center';

		const winState = document.createElement('span');
		winState.innerHTML = `${match.isWinner ? '⭐' : '-'}`;
		winState.className = `py-5 px-2`;

		const user = document.createElement('span');
		user.innerHTML = match.score!.toString();
		user.className = `p-5 border-t border-x rounded-t-xl ${textColor}`;

		const opponent = document.createElement('span');
		opponent.innerHTML = match.opponent?.score!.toString() as string;
		opponent.className = `p-5 border-b border-x rounded-b-xl  ${textColor}`;


		card.appendChild(winState);
		card.appendChild(user);
		card.appendChild(opponent);

		return card;
	}

}

customElements.define('latest-match', LatestMatch);
