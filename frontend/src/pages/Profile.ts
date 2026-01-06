import { AppContext, GameHistory, UserState } from "../types.js";
import { friendshipApi } from "../api/friendshipApi.js";
import { router } from "../main.js";

// import HTML components
import "../components/NavBar.js";
import "../components/ProfileCard.js";
import "../components/LatestMatch.js";
import "../components/BigStats.js";
import "../components/MatchHistory.js";
import "../components/Statistics.js"
import { gameService } from "../services/GameService.js";


export function Profile(ctx: AppContext): string {
	setTimeout( async () => {
		const gameHistory: GameHistory[] = await gameService.getHistory();
		const currentUser: UserState | null = ctx.userStore.get();
		passContext(ctx, gameHistory, currentUser);
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

			<!-- Statistics -->
			<div class="w-full mx-auto max-w-2xl lg:max-w-7xl mb-10 ">
				<game-statistics class="flex flex-col bg-white p-10 shadow-sm rounded-lg" id='stats-component'></game-statistics>
			</div>

			<!-- Match history -->
			<div class="w-full mx-auto max-w-2xl lg:max-w-7xl mb-10">
				<match-history id='match-history-component' class="bg-white p-10 shadow-sm rounded-lg h-full flex flex-col gap-3 max-h-[80vh] lg:max-h-[50vh]"></match-history>
				<!-- <div id='match-history' class="bg-white p-10 shadow-sm rounded-lg h-full flex flex-col gap-3 max-h-150"> -->
			</div>
		</div>
		
	`;

	return content;
}

function passContext(ctx: AppContext, gameHistory: GameHistory[], currentUser: UserState | null) {
	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const profileCardComponent = document.getElementById('profile-card-component') as any;
	if (profileCardComponent) {
		profileCardComponent.ctx = ctx;
		profileCardComponent.user = currentUser;
	}
	const bigStatsComponent = document.getElementById('big-stats-component') as any;
	if (bigStatsComponent) {
		bigStatsComponent.ctx = ctx;
		bigStatsComponent.gameHistory = gameHistory;
	}
	const statsComponent = document.getElementById('stats-component') as any;
	if (statsComponent) {
		statsComponent.ctx = ctx;
		statsComponent.gameHistory = gameHistory;
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