import { AppContext, GameHistory } from "../types.js";
import { router } from "../main.js";

// import HTML components
import "../components/NavBar.js";
import "../components/ProfileCard.js";
import "../components/LatestMatch.js";
import "../components/BigStats.js";
import "../components/MatchHistory.js";
import { gameApi } from "../api/gameApi.js";


export function Profile(ctx: AppContext): string {
	setTimeout( async () => {
		const gameHistory: GameHistory[] = await gameApi.getHistory();
		passContext(ctx, gameHistory);
	}, 0);

	const content: string =
	/*html*/`
		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>
		<div class="flex flex-col w-full mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
			<!-- profile card + last matches -->
			<div class="w-full mt-10 flex flex-col md:flex-row gap-8 sm:mt-16">
				<div class="flex lg:w-1/4">
					<profile-card id='profile-card-component' class='w-full overflow-hidden rounded-lg bg-white shadow-sm'></profile-card>
				</div>
				<div class="flex-1">
					<latest-match id='latest-match-component' class="w-full overflow-hidden rounded-lg bg-white shadow-sm"></latest-match>
				</div>
			</div>

			<!-- big stats -->
			<big-stats class="py-24 sm:py-32" id='big-stats-component'></big-stats>

			<!-- Match history -->
			<div class="w-full mx-auto max-w-2xl lg:max-w-7xl mb-10">
				<match-history id='match-history-component' class="bg-white p-10 shadow-sm rounded-lg h-full flex flex-col gap-3 max-h-150"></match-history>
				<!-- <div id='match-history' class="bg-white p-10 shadow-sm rounded-lg h-full flex flex-col gap-3 max-h-150"> -->
				</div>
			</div>

			<!-- Statistics -->
			<div class="w-full mx-auto mb-10 max-w-2xl px-6 lg:max-w-7xl lg:px-8">
				<div class="bg-white p-10 shadow-sm rounded-lg">
					<h1>Statistics</h1>
				</div>
			</div>
		</div>
	`;

	return content;
}

function passContext(ctx: AppContext, gameHistory: GameHistory[]) {
	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const profileCardComponent = document.getElementById('profile-card-component') as any;
	if (profileCardComponent) {
		profileCardComponent.ctx = ctx;
	}
	const bigStatsComponent = document.getElementById('big-stats-component') as any;
	if (bigStatsComponent) {
		bigStatsComponent.ctx = ctx;
		bigStatsComponent.gameHistory = gameHistory;
	}
	const matchHistoryComponent = document.getElementById('match-history-component') as any;
	if (matchHistoryComponent) {
		matchHistoryComponent.ctx = ctx;
		matchHistoryComponent.gameHistory = gameHistory;
	}
	const latestMatchComponent = document.getElementById('latest-match-component') as any;
	if (latestMatchComponent) {
		latestMatchComponent.ctx = ctx;
		latestMatchComponent.gameHistory = gameHistory;
	}
}