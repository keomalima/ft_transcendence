import type { AppStores } from "../store/store.js";
import { router } from "../main.js";
import { userService } from "../services/UserService.js";

// import HTML components
import "../components/NavBar.js";
import "../components/ProfileCard.js";
import "../components/LatestMatch.js";
import "../components/BigStats.js";
import "../components/MatchHistory.js";


export function Profile(ctx: AppStores): string {
	const currentUser = ctx.user.get();
	const accessToken = currentUser?.accessToken;
	if (!accessToken)
	{
		console.log('no session when access /login')
		router.navigateTo('/');
		return '';
	}

	userService.getUserState(ctx, currentUser.id);

	setTimeout(() => {
		passContext(ctx);
	}, 0);

	const content: string =
	/*html*/`
		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>
		<div class="flex flex-col">
			<!-- profile card + last matches -->
			<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
				<div class="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-1">
					<div class="flex p-px lg:col-span-2">
						<profile-card id='profile-card-component' class='w-full overflow-hidden rounded-lg bg-white shadow-sm'></profile-card>
					</div>
					<div class="flex p-px lg:col-span-4">
						<latest-match class="w-full overflow-hidden rounded-lg bg-white shadow-sm"></latest-match>
					</div>
				</div>
			</div>

			<!-- big stats -->
			<big-stats class="py-24 sm:py-32" id='big-stats-component'></big-stats>

			<!-- Match history -->
			<div class="w-full mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mb-10">
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

function passContext(ctx: AppStores) {
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
	}
	const matchHistoryComponent = document.getElementById('match-history-component') as any;
	if (matchHistoryComponent) {
		matchHistoryComponent.ctx = ctx;
	}
}