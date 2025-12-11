import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";

// import HTML components
import "../components/NavBar.js";

// import styles
import { RADIO_LABEL, BUTTON_CREAM_CLASSES, BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { tournamentApi } from "../api/tournamentApi.js";

export function TournamentPage(ctx: AppContext): string {
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
					Compete against multiple players in bracket-style tournaments. Create your own or join an existing one!
				</p>
			</div>

		<!-- Action Cards -->
		${tournamentId ?
		`
		<div class="flex flex-col items-center gap-6 max-w-2xl w-full">
			<!-- Pending Tournament Card -->
			<div class="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-8 w-full border-2 border-gray-400">
				<div class="text-center">
					<div class="text-6xl mb-4">🏆</div>
					<h2 class="text-2xl font-bold text-gray-800 mb-3">Tournament in Progress</h2>
					<p class="text-gray-600 mb-6">
						You have an ongoing tournament
					</p>
					<a data-link href='/tournament-room/${tournamentId}' 
					   class='inline-block ${BUTTON_WHITE_CLASSES}'>
						Continue
					</a>
				</div>
			</div>
		</div>
		`
		:
		`
		<div class="flex flex-col md:flex-row gap-6 max-w-4xl w-full">
			<!-- Create Tournament Card -->
			<div class="flex-1 bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-8 border border-gray-300 hover:border-gray-400 transition-all">
				<div class="text-center">
					<div class="text-6xl mb-4">🏆</div>
					<h2 class="text-2xl font-bold text-gray-800 mb-3">Create Tournament</h2>
					<p class="text-gray-600 mb-6">
						Host your own tournament and invite players to compete for the championship.
					</p>
					<button type='button' id='create-tournament-btn' class='${BUTTON_WHITE_CLASSES} w-full'>
						CREATE TOURNAMENT
					</button>
				</div>
			</div>

			<!-- Join Tournament Card -->
			<div class="flex-1 bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-8 border border-gray-300 hover:border-gray-400 transition-all">
					<div class="text-center">
						<div class="text-6xl mb-4">🎮</div>
						<h2 class="text-2xl font-bold text-gray-800 mb-3">Join Tournament</h2>
						<p class="text-gray-600 mb-6">
							Enter an existing tournament with a token to compete with your friends.
						</p>
						<button onclick="document.getElementById('join-tournament-dialog').showModal()" type='button' id='join-tournament-btn' class='${BUTTON_WHITE_CLASSES} w-full'>
							JOIN TOURNAMENT
						</button>
					</div>
				</div>
			</div>
		`
		}
			<!-- Error Message -->
			<p id='error-create-tournament' class='mt-6 text-center'></p>
		</div>
	</div>

	<!-- Dialog for join tournament -->
	<dialog id="join-tournament-dialog" class="place-self-center">
		<join-game-pop-up id="join-tournament-component"></join-game-pop-up>
	</dialog>
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
	
	const joinTournamentComponent = document.getElementById('join-tournament-component') as any;
	if (joinTournamentComponent) {
		joinTournamentComponent.type = 'tournament';
		joinTournamentComponent.ctx = ctx;
	}

}

// ======== EVENT LISTENER ============
function setupTournamentEventListeners(ctx: AppContext) {

	const joinTournamentComponent = document.getElementById('join-tournament-component') as any;

	// **** CREATE TOURNAMENT ****
	const createBtn = document.getElementById('create-tournament-btn');
	createBtn?.addEventListener('click', async (e) => {
		e.preventDefault();
		// Navigate to create tournament page or show modal with settings
		router.navigateTo('/create-tournament');
	});

	// **** JOIN TOURNAMENT ****
	joinTournamentComponent?.addEventListener('event-join-tournament', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			const result = await tournamentApi.joinTournament(data);
			console.log(result);
			router.navigateTo(`/tournament-room/${result.tournamentId}`);
		} catch (error) {
			const errorMsgJoinGame = document.querySelector('#error-join-tournament') as HTMLParagraphElement;
			errorMsgJoinGame.className = 'mt-2 text-red-500'
			errorMsgJoinGame.innerText = error as string;
			console.log(error);
		}
	})
}
