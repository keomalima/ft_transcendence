import type { AppStores } from "../store/store.js";
import { MatchData } from "../data/matchData.js";

interface matchInfo {
	id: number;
	opponentName: string;
	scoreUser: number;
	scoreOpponent: number;
	winner: boolean;
	duration: number;
	date: string;
	mode: string;
}

export class LatestMatch extends HTMLElement {
	private _ctx: AppStores | null = null;
	
	constructor() {
		super();
	}

	set ctx(value : AppStores)
	{
		this._ctx = value;
	}

	connectedCallback() {
		this.render();
		this.generateMatchCards();
	}

	private render() {
		this.innerHTML = 
		/*html*/`
			<div class="col-span-4 sm:col-span-9">
				<div class="bg-white rounded-lg p-6">
					<h1>Latest match scores</h1>
					<div id='last-match-scores' class='mt-3 overflow-x-auto whitespace-nowrap p-5'>
						<span class='inline-grid grid-cols-1 grid-rows-3 mx-2 text-center'>
							<span class='p-5 text-white'>.</span>
							<span class='p-5 pl-0'>you</span>
							<span class='p-5 pl-0'>opponent</span>
						</span>
					</div>
				</div>
			</div>
		`;
	}

	private generateMatchCards() {
		const scores = document.getElementById('last-match-scores');

		MatchData.forEach((s) => {
			scores?.appendChild(this.createScoreCard(s));
		})
	}

	private createScoreCard(match: matchInfo) : HTMLElement {

		const textColor : string = match.scoreUser >= match.scoreOpponent ? 'bg-black text-white font-semibold' : 'bg-white';
		const bgColor : string = match.scoreUser === match.scoreOpponent ? 'bg-gray-400' : '';

		const card = document.createElement('span');
		card.className = 'inline-grid grid-cols-1 grid-rows-3 mx-2 rounded-xl text-center';

		const winState = document.createElement('span');
		winState.innerHTML = `${match.scoreUser > match.scoreOpponent ? '⭐' : '-'}`;
		winState.className = `py-5 px-2`;

		const user = document.createElement('span');
		user.innerHTML = match.scoreUser.toString();
		user.className = `p-5 border-t border-x rounded-t-xl ${textColor} ${bgColor}`;

		const opponent = document.createElement('span');
		opponent.innerHTML = match.scoreOpponent.toString();
		opponent.className = `p-5 border-b border-x rounded-b-xl  ${textColor} ${bgColor}`;


		card.appendChild(winState);
		card.appendChild(user);
		card.appendChild(opponent);

		return card;
	}

}

customElements.define('latest-match', LatestMatch);
