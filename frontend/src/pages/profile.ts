import { NavBar } from "../components/NavBar";
import { ProfileCard } from "../components/ProfileCard";
import { LastMatches } from "../components/LastMatches";
import { BigStat } from "../components/BigStats";
import { MatchHistory } from "../components/MatchHistory";

export function Profile() {
	const root = document.getElementById('root');
	if (root)
	{
		root.innerHTML = /*html*/`


		<header id='navigation-bar'></header>

		<!-- profile card + last matches -->
		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
			<div class="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-1">
				<div class="flex p-px lg:col-span-2">
					<div id='profile-card' class="w-full overflow-hidden rounded-lg bg-white shadow-sm outline outline-black/5"></div>
				</div>
				<div class="flex p-px lg:col-span-4">
					<div class="w-full overflow-hidden rounded-lg bg-white shadow-sm outline outline-black/5 " id='last-matches'></div>
				</div>
			</div>
		</div>

		<!-- big stats -->
		<div class="py-24 sm:py-32" id='big-stats'></div>

		<!-- Match history -->
		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mb-10">
			<div id='match-history' class="bg-white p-10 shadow-sm rounded-lg">
				<h1>Match history</h1>
			</div>
		</div>

		<!-- Statistics -->
		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
			<div class="bg-white p-10 shadow-sm rounded-lg">
				<h1>Statistics</h1>
			</div>
		</div>
		`;
	}
	NavBar();
	ProfileCard();
	LastMatches();
	BigStat();
	MatchHistory();
}
