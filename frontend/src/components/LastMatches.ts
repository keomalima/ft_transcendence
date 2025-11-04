import { MatchData } from "../data/matchData";
import { matchInfo } from "../types";

export function LastMatches() : HTMLElement | null {
	const lastMatches = document.getElementById('last-matches');
	if (lastMatches)
	{
		lastMatches.innerHTML = /*html*/`
		<div class="col-span-4 sm:col-span-9">
			<div class="bg-white rounded-lg p-6">
				<h1>Last Matches</h1>
				<div id='last-match-scores' class='mt-10'>

				</div>
			</div>
		</div>
		`;
	}
	const scores = document.getElementById('last-match-scores');

	MatchData.forEach((s) => {
		scores?.appendChild(createScoreCard(s));
	})
	
	return lastMatches;
}

function createScoreCard(match: matchInfo) : HTMLElement {


	console.log('user score', match.scoreUser);
	console.log('opponent score', match.scoreOpponent);

	const card = document.createElement('span');
	card.className = `inline-grid grid-cols-1 grid-rows-2 mx-2 outline-2 outline-black rounded-xl text-center
		${match.scoreUser >= match.scoreOpponent ? 'bg-black text-white' : 'bg-white'}
		${match.scoreUser === match.scoreOpponent ? 'bg-gray-400 text-red-500' : ''}`;

	const user = document.createElement('span');
	user.innerHTML = match.scoreUser.toString();
	user.className = 'p-5';

	const opponent = document.createElement('span');
	opponent.innerHTML = match.scoreOpponent.toString();
	opponent.className = 'p-5';


	card.appendChild(user);
	card.appendChild(opponent);

	return card;
}