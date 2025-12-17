import { AppContext, TournamentData, TournamentGame, UserState } from "../types.js";
import { router } from "../main.js";

// import HTML components
import "../components/NavBar.js";
import "../components/TournamentBracket.js";

// import styles
import { tournamentApi } from "../api/tournamentApi.js";

export function Tournament(ctx: AppContext, params?: Record<string, string>): string {
	//get user data from store
	const currentUser: UserState | null = ctx.userStore.get();
	
	// secure if no params
	if (!params || !params['id'])
	{
		console.log('no params available')
		setTimeout(() => router.navigateTo('/home'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	setTimeout(async () => {
		const currentTournament = await getCurrentTournament();
		const tournamentGames = await getTournamentGames(params['id']);
		renderTournamentContent();
		passContext(ctx, tournamentGames, currentTournament);
		setupTournamentEventListeners(ctx);
	}, 0);

	return (/*html*/`
		<div id="tournament-content">
			<p class='flex items-center justify-center h-screen'>Loading tournament data...</p>
		</div>
	`);
}

function renderTournamentContent() {

	const content = document.getElementById('tournament-content');
	content!.innerHTML = /*html*/`
	<div class="flex flex-col min-h-screen">
	    <header>
	        <nav-bar id='nav-bar-component'></nav-bar>
	    </header>
	
	    <div class="flex-1 flex flex-col items-center justify-center h-full px-4 py-8">
	        <div class="text-center mb-12">
	            <h1 class="text-5xl font-bold text-gray-800 mb-4">Tournament</h1>
	        </div>
	
	        <div class="w-full">
	            <tournament-bracket id='tournament-game-component'></tournament-bracket>
	        </div>
	    </div>
	</div>
	`
	return content;
}

// ======== GET TOURNAMENT GAMES ============
async function getTournamentGames(tournamentId: string): Promise<TournamentGame | null > {
	try {
		const tournamentGames = await tournamentApi.getTournamentGames(tournamentId);
		return tournamentGames;
	} catch(error) {
		return null;
	}
}

// ======== GET CURRENT TOURNAMENT ============
async function getCurrentTournament(): Promise<Partial< TournamentData | null>> {
	try {
		const currentTournament = await tournamentApi.getCurrentTournament();
		return currentTournament;
	} catch(error) {
		return null;
	}
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext, tournamentGames: TournamentGame | null, tournament: Partial<TournamentData | null>) {

	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const tournamentGameComponent = document.getElementById('tournament-game-component') as any
	if (tournamentGameComponent) {
		tournamentGameComponent.ctx = ctx;
		tournamentGameComponent.tournamentGamesData = tournamentGames;
		tournamentGameComponent.tournamentData = tournament;
	} else {
		console.error('❌ Tournament games component not found!');
	}
}

// ======== EVENT LISTENER ============
function setupTournamentEventListeners(ctx: AppContext) {

}
