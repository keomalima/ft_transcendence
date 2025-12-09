import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";
import { gameApi } from "../api/gameApi.js";

// import HTML components
import "../components/NavBar.js";

// import styles
import { RADIO_LABEL, BUTTON_CREAM_CLASSES } from "../styles/tailwindStyles.js";
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

		<div class="flex-1 flex flex-col items-center justify-center h-full">
			<!-- Select mode -->
			<h1 class='text-3xl'>Tournament settings</h1>

			<form id='tournament-settings'class='flex flex-col gap-10 items-center justify-center mt-20 h-full'>
				<fieldset class="flex flex-row mt-5 gap-8 justify-between">
					<legend class="w-full text-center mb-4 text-xl font-[Calistoga] font-medium">Number of players</legend>
					<div class="flex-1 h-10">
						<input
						type="radio"
						id="4-players"
						name="nbr_players"
						value="4"
						class="hidden peer h-full"
						checked />
						<label for="4-players" class="${RADIO_LABEL} h-full flex items-center justify-center">
						4
						</label>
					</div>
					<div class="flex-1 h-10">
						<input
						type="radio"
						id="8-players"
						name="nbr_players"
						value="8"
						class="hidden peer h-full"
						checked />
						<label for="8-players" class="${RADIO_LABEL} h-full flex items-center justify-center">
						8
						</label>
					</div>
					<div class="flex-1 h-10">
						<input
						type="radio"
						id="16-players"
						name="nbr_players"
						value="16"
						class="hidden peer h-full"
						checked />
						<label for="16-players" class="${RADIO_LABEL} h-full flex items-center justify-center">
						16
						</label>
					</div>
				</fieldset>
				<div class='flex flex-col items-center justify-center'>
					<label for="score-to-win" class='w-full text-center mb-4 text-xl font-[Calistoga] font-medium'>Score to win</label>
					<input type="number" id="score-to-win" name='score_to_win'
					value="3"
					min="3"
      				max="20"
					class="w-1/2 min-w-20 px-3 py-2.5 bg-white border border-black text-lg rounded-full placeholder:text-body" placeholder="score" required />
				</div>
				<hr class="w-full h-px border-0 bg-medium">
				<button type='submit' class='${BUTTON_CREAM_CLASSES}'>CREATE TOURNAMENT</button>
				<p id='error-create-tournament'></p>
			</form>

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
