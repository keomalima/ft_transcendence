import { MatchData } from "../data/matchData";
import { matchInfo } from "../types";
import profilePicture from '../images/ProfilePictureSquared.png';

export function  MatchHistory() : HTMLElement | null {
	const history = document.getElementById('match-history');
	if (history)
	{
		history.innerHTML = /*html*/`
		<h1>Match history</h1>

		<div class="px-4 sm:px-6 lg:px-8">
			<div class="mt-8 flow-root">
				<div class="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
				<div class="inline-block min-w-full py-2 align-middle">
					<table class="min-w-full border-separate border-spacing-0">
					<thead>
						<tr>
						<th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-white/75 py-3.5 pr-3 pl-4 text-center text-sm font-semibold text-gray-900 backdrop-blur-sm backdrop-filter sm:pl-6 lg:pl-8">opponent</th>
						<th scope="col" class="sticky top-0 z-10 hidden border-b border-gray-300 bg-white/75 px-3 py-3.5 text-center text-sm font-semibold text-gray-900 backdrop-blur-sm backdrop-filter sm:table-cell">score</th>
						<th scope="col" class="sticky top-0 z-10 hidden border-b border-gray-300 bg-white/75 px-3 py-3.5 text-center text-sm font-semibold text-gray-900 backdrop-blur-sm backdrop-filter lg:table-cell">duration</th>
						<th scope="col" class="sticky top-0 z-10 hidden border-b border-gray-300 bg-white/75 px-3 py-3.5 text-center text-sm font-semibold text-gray-900 backdrop-blur-sm backdrop-filter lg:table-cell">date</th>
						<th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-white/75 px-3 py-3.5 text-center text-sm font-semibold text-gray-900 backdrop-blur-sm backdrop-filter">mode</th>
						<!-- <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-white/75 py-3.5 pl-3 backdrop-blur-sm backdrop-filter sm:pr-6 lg:pr-8">mode</th> -->
						</tr>
					</thead>
					<tbody id='match-data'>

					</tbody>
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
    profile.className = 'border-b border-gray-200 py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6 lg:pl-8 flex flex-col justify-center items-center gap-2';

    const img = document.createElement('img');
    img.className = 'w-10 h-10 bg-gray-300 rounded-full shrink-0';
    img.src = profilePicture;

    const opponent = document.createElement('p');
    opponent.className = 'my-0';
    opponent.innerHTML = `${match.opponentName}`;

    profile.appendChild(img);
    profile.appendChild(opponent);

    const score = document.createElement('td');
    score.className = 'hidden border-b border-gray-200 px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:table-cell text-center';
    score.innerHTML = `${match.scoreUser.toString()} - ${match.scoreOpponent.toString()}`;

    const duration = document.createElement('td');
    duration.className = 'hidden border-b border-gray-200 px-3 py-4 text-sm whitespace-nowrap text-gray-500 lg:table-cell text-center';
    duration.innerHTML = `${match.duration}`;

    const date = document.createElement('td');
    date.className = 'border-b border-gray-200 px-3 py-4 text-sm whitespace-nowrap text-gray-500 text-center';
    date.innerHTML = `${match.date}`;

    const mode = document.createElement('td');
    mode.className = 'border-b border-gray-200 py-4 pr-4 pl-3 text-sm whitespace-nowrap sm:pr-8 lg:pr-8 text-center';
    mode.innerHTML = `${match.mode}`;

    elem.appendChild(profile);
    elem.appendChild(score);
    elem.appendChild(duration);
    elem.appendChild(date);
    elem.appendChild(mode);

    return elem;
}

	// <tr>
	// <td class="border-b border-gray-200 py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6 lg:pl-8">Courtney Henry</td>
	// <td class="hidden border-b border-gray-200 px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:table-cell">Designer</td>
	// <td class="hidden border-b border-gray-200 px-3 py-4 text-sm whitespace-nowrap text-gray-500 lg:table-cell">courtney.henry@example.com</td>
	// <td class="border-b border-gray-200 px-3 py-4 text-sm whitespace-nowrap text-gray-500">Admin</td>
	// <td class="border-b border-gray-200 py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-8 lg:pr-8">
	// 	<a href="#" class="text-indigo-600 hover:text-indigo-900">Edit<span class="sr-only">, Courtney Henry</span></a>
	// </td>
	// </tr>