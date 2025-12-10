import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";
import { gameApi } from "../api/gameApi.js";

// import HTML components
import "../components/NavBar.js";

// import styles
import { RADIO_LABEL, BUTTON_CREAM_CLASSES, BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { tournamentApi } from "../api/tournamentApi.js";

export function CreateTournament(ctx: AppContext): string {
	//get user data from store
	const currentUser: UserState | null = ctx.userStore.get();
	
	setTimeout(() => {
		passContext(ctx);
		setupTournamentEventListeners(ctx);
	}, 0);

	const content = /*html*/`
	<div class="flex flex-col min-h-screen">
		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>

		<div class="flex-1 flex flex-col items-center justify-center h-full px-4 py-8">
		<!-- Title Section -->
		<div class="text-center mb-8">
			<h1 class='text-4xl font-bold text-gray-800 mb-2'>Tournament Settings</h1>
			<p class="text-gray-600">Configure your tournament bracket</p>
		</div>

		<!-- Form Card -->
		<div class="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-8 md:p-12 max-w-2xl w-full border border-gray-300">
				<form id='tournament-settings' class='flex flex-col gap-8'>
			<fieldset class="flex flex-col">
				<legend class="w-full text-center mb-6 text-2xl font-[Calistoga] font-medium">Number of Players</legend>
				<div class="flex flex-row gap-4 justify-center">
				<div class="w-20 h-12">
					<input
					type="radio"
					id="4-players"
					name="nbr_players"
					value="4"
					class="hidden peer h-full w-full"
					checked />
					<label for="4-players" class="${RADIO_LABEL} h-full w-full flex items-center justify-center text-lg">
					4
					</label>
				</div>
				<div class="w-20 h-12">
					<input
					type="radio"
					id="8-players"
					name="nbr_players"
					value="8"
					class="hidden peer h-full w-full" />
					<label for="8-players" class="${RADIO_LABEL} h-full w-full flex items-center justify-center text-lg">
					8
					</label>
				</div>
				<div class="w-20 h-12">
					<input
					type="radio"
					id="16-players"
					name="nbr_players"
					value="16"
					class="hidden peer h-full w-full" />
					<label for="16-players" class="${RADIO_LABEL} h-full w-full flex items-center justify-center text-lg">
					16
					</label>
				</div>
				</div>
			</fieldset>					<hr class="w-full border-t border-gray-300">

					<div class='flex flex-col items-center justify-center'>
						<label for="score-to-win" class='w-full text-center mb-4 text-2xl font-[Calistoga] font-medium'>Score to Win</label>
						<p class="text-gray-600 text-sm mb-4">First player to reach this score wins the match</p>
						<input type="number" id="score-to-win" name='score_to_win'
						value="3"
						min="3"
						max="20"
						class="w-32 px-4 py-3 bg-white border-2 border-gray-300 text-xl text-center font-semibold rounded-full focus:border-gray-500 focus:outline-none" required />
					</div>

					<hr class="w-full border-t border-gray-300">

					<div class="flex flex-col gap-3">
						<button type='submit' class='${BUTTON_WHITE_CLASSES} w-full text-lg py-3'>CREATE TOURNAMENT</button>
						<button type='button' id='back-btn' class='w-full px-6 py-3 border-2 border-gray-300 rounded-full font-medium hover:bg-gray-100 transition-colors'>
							← Back
						</button>
					</div>
					<p id='error-create-tournament' class='text-center'></p>
				</form>
			</div>

		</div>
	</div>
	`
	return content;
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

	// **** BACK BUTTON ****
	const backBtn = document.getElementById('back-btn');
	backBtn?.addEventListener('click', () => {
		router.navigateTo('/tournament');
	});

	// **** CREATE TOURNAMENT ****
	const form = document.querySelector('form[id="tournament-settings"]') as HTMLFormElement;
	form?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const nbrPlayers = (document.querySelector('input[name="nbr_players"]:checked') as HTMLInputElement)?.value;
		const scoreToWin = (document.querySelector('input[name="score_to_win"]') as HTMLInputElement)?.value;

		try {
			const result = await tournamentApi.createTournament(parseInt(nbrPlayers), parseInt(scoreToWin));
			router.navigateTo(`/tournament-room/${result.id}`);
		} catch (error) {
			const errorMsgCreateGame = document.querySelector('#error-create-tournament') as HTMLParagraphElement;
			errorMsgCreateGame.className = 'text-red-500'
			errorMsgCreateGame.innerText = error as string;
			console.log(error);
		}

	})
}
