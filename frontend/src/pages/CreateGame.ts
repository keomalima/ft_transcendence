import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";

// import HTML components
import "../components/NavBar.js";

// import styles
import { RADIO_LABEL, BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { gameService } from "../services/GameService.js";


export function CreateGame(ctx: AppContext): string{
    // get user data from store
    const currentUser: UserState | null = ctx.userStore.get();

	setTimeout(() => {
		passContext(ctx);
		setupGameEventListeners(ctx);
	}, 0);

	const content = /*html*/`
	<div class="flex flex-col min-h-screen">
		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>

		<div class="flex-1 flex flex-col items-center justify-center h-full px-4 py-8">
			<!-- Title Section -->
			<div class="text-center mb-8">
				<h1 class='text-4xl font-bold text-gray-800 mb-2'>Game Settings</h1>
				<p class="text-gray-600">Configure your game</p>
			</div>

			<!-- Form Card -->
			<div class="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-8 md:p-12 max-w-2xl w-full border border-gray-300">
				<form id='game-settings' class='flex flex-col gap-8'>
					<fieldset class="flex flex-col">
						<legend class="w-full text-center mb-6 text-2xl font-[Calistoga] font-medium">Select Playing Mode</legend>
						<div class="flex flex-row gap-4 justify-center">
							<div class="flex-1 h-12">
								<input
								type="radio"
								id="remote-mode"
								name="playing_mode"
								value="ONLINE"
								class="hidden peer h-full w-full" 
								checked />
								<label for="remote-mode" class="${RADIO_LABEL} h-full w-full flex items-center justify-center text-xl">
								Online
								</label>
							</div>
							<div class="flex-1 h-12">
								<input
								type="radio"
								id="local-mode"
								name="playing_mode"
								value="LOCAL"
								class="hidden peer h-full w-full"
								/>
								<label for="local-mode" class="${RADIO_LABEL} h-full w-full flex items-center justify-center text-xl">
								Local
								</label>
							</div>
						</div>
					</fieldset>

					<hr class="w-full border-t border-gray-300">

					<div class='flex flex-col items-center justify-center'>
						<label for="score-to-win" class='w-full text-center mb-4 text-2xl font-[Calistoga] font-medium'>Score to Win</label>
						<p class="text-gray-600 text-sm mb-4">First player to reach this score wins the match</p>
						<input type="number" id="score-to-win" name='score_to_win'
						value="3"
						min="3"
						max="10"
						class="w-32 px-4 py-3 bg-white border-2 border-gray-300 text-xl text-center font-semibold rounded-full focus:border-gray-500 focus:outline-none" required />
					</div>

					<hr class="w-full border-t border-gray-300">

					<div class="flex flex-col gap-3">
						<button type='submit' class='${BUTTON_WHITE_CLASSES} w-full text-lg py-3'>CREATE GAME</button>
						<a data-link href='/home' type='button' id='back-btn' class='w-full px-6 py-3 border-2 border-gray-300 rounded-full font-medium hover:bg-gray-100 transition-colors text-center'>
							← Back
						</a>
						<p id='error-create-game' class='text-center'></p>
					</div>
				</form>
			</div>

		</div>
	</div>
	`
	return (content);
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext) {

	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}

}

// ======== EVENT LISTENER ============
function setupGameEventListeners(ctx: AppContext) {
	// **** CREATE GAME ****
	const form = document.querySelector('form[id="game-settings"]') as HTMLFormElement;
	form?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const selectedMode = (document.querySelector('input[name="playing_mode"]:checked') as HTMLInputElement)?.value;
		const scoreToWin = (document.querySelector('input[name="score_to_win"]') as HTMLInputElement)?.value;
		const errorMsgCreateGame = document.querySelector('#error-create-game') as HTMLParagraphElement;
		if (errorMsgCreateGame)
			errorMsgCreateGame.className = 'text-red-500'

		if (!scoreToWin || parseInt(scoreToWin) < 3 || parseInt(scoreToWin) > 10) {
			errorMsgCreateGame.innerText = "Score must be between 3 and 10.";
			return;
		}

		try {
			const result = await gameService.createGame({
				scoreToWin: parseInt(scoreToWin),
				type: selectedMode
			}, ctx);
			if (selectedMode === 'LOCAL')
				router.navigateTo(`/local-game/${result!.id}`);
			else
				router.navigateTo(`/game-room/${result!.id}`);
		} catch (error) {
			errorMsgCreateGame.innerText = error as string;
		}

	})
}
