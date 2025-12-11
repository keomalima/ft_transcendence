import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";

// import HTML components
import "../components/NavBar.js";

// import styles
import { tournamentApi } from "../api/tournamentApi.js";

export function Tournament(ctx: AppContext): string {
	//get user data from store
	const currentUser: UserState | null = ctx.userStore.get();
	
	setTimeout(async () => {
		const currentTournament = await getCurrentTournament();
		renderTournamentContent(currentUser!, currentTournament?.tournamentId!);
		passContext(ctx);
		setupTournamentEventListeners(ctx);
	}, 0);

	return (/*html*/`
		<div id="tournament-content">
			<p class='flex items-center justify-center h-screen'>Loading tournament data...</p>
		</div>
	`);
}

function renderTournamentContent(currentUser: UserState, tournamentId: string | null) {

	const content = document.getElementById('tournament-content');
	content!.innerHTML = /*html*/`
	<div class="flex flex-col min-h-screen">
		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>

		<div class="flex-1 flex flex-col items-center justify-center h-full px-4 py-8">
			<!-- Title Section -->
			<div class="text-center mb-12">
				<h1 class="text-5xl font-bold text-gray-800 mb-4">Tournaments</h1>
				<p class="text-lg text-gray-600 max-w-2xl">
					Tournament brackets comming soon
				</p>
			</div>
	`
	return content;
}

// ======== GET CURRENT TOURNAMENT ============
async function getCurrentTournament(): Promise<{userId: string, tournamentId: string, type: string, token: string | null} | null> {
	try {
		const currentTournament = await tournamentApi.getCurrentTournament();
		return currentTournament;
	} catch(error) {
		console.log(error);
		return null;
	}
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext) {

	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}

}

// ======== EVENT LISTENER ============
function setupTournamentEventListeners(ctx: AppContext) {

}
