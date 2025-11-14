import { MatchData } from "../data/matchData";
import { matchInfo } from "../types";
import profilePicture from '../images/ProfilePictureSquared.png';

export function  MatchHistory() : HTMLElement | null {
	const history = document.getElementById('match-history');
	if (history)
	{
		history.innerHTML = /*html*/`
		<h1>Match history</h1>

		<div class="px-4 sm:px-6 lg:px-8 max-h-150 overflow-auto">	
			<div class="mt-8 flow-root">
				<div class="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
				<div class="inline-block min-w-full py-2 align-middle">
					<table class="min-w-full border-separate border-spacing-0 pr-5 pb-5">
					<thead>
						<tr>
						<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium backdrop-blur-sm backdrop-filter sm:table-cell">opponent</th>
						<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium backdrop-blur-sm backdrop-filter sm:table-cell">score</th>
						<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium backdrop-blur-sm backdrop-filter sm:table-cell">duration</th>
						<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium backdrop-blur-sm backdrop-filter sm:table-cell">date</th>
						<th scope="col" class="sticky top-0 z-10 border-b border-medium px-3 py-3.5 text-center text-sm text-medium backdrop-blur-sm backdrop-filter sm:table-cell">mode</th>
						</tr>
					</thead>
					<tbody id='match-data'></tbody>
					</table>
				</div>
				</div>
			</div>
		</div>
		`
	}

	const scores = document.getElementById('match-data');
	MatchData.forEach((s) => {
		scores?.appendChild(createMatchElem(s));
	})

	return history;
}


function createMatchElem(match: matchInfo) : HTMLElement {

    const elem = document.createElement('tr');

    const profile = document.createElement('td');
    profile.className = 'border-b border-creamgrey px-3 py-4 text-sm font-medium whitespace-nowrap text-gray-900 flex flex-col justify-center items-center gap-2';

    const img = document.createElement('img');
    img.className = 'w-10 h-10 bg-gray-300 rounded-full shrink-0';
    img.src = profilePicture;

    const opponent = document.createElement('p');
    opponent.className = 'my-0';
    opponent.innerHTML = `${match.opponentName}`;

    profile.appendChild(img);
    profile.appendChild(opponent);

    const score = document.createElement('td');
    score.className = 'border-b border-creamgrey px-3 py-4 text-sm whitespace-nowrap sm:table-cell text-center';
    score.innerHTML = `${match.scoreUser.toString()} - ${match.scoreOpponent.toString()}`;

    const duration = document.createElement('td');
    duration.className = 'border-b border-creamgrey px-3 py-4 text-sm whitespace-nowrap lg:table-cell text-center';
    duration.innerHTML = `${match.duration}`;

    const date = document.createElement('td');
    date.className = 'border-b border-creamgrey px-3 py-4 text-sm whitespace-nowrap text-center';
    date.innerHTML = `${match.date}`;

    const mode = document.createElement('td');
    mode.className = 'border-b border-creamgrey py-4 pr-4 pl-3 text-sm whitespace-nowrap text-center';
    mode.innerHTML = `${match.mode}`;

    elem.appendChild(profile);
    elem.appendChild(score);
    elem.appendChild(duration);
    elem.appendChild(date);
    elem.appendChild(mode);

    return elem;
}
