import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";
import { gameApi } from "../api/gameApi.js";

// import HTML components
import "../components/NavBar.js";

// import styles
import { RADIO_LABEL, BUTTON_CREAM_CLASSES } from "../styles/tailwindStyles.js";


export function CreateGame(ctx: AppContext): string{
    // get user data from store
    const currentUser: UserState | null = ctx.userStore.get();
    console.log('current user ', currentUser);

    // secure if no access token or user ID
    if (!currentUser?.accessToken || !currentUser?.id)
    {
        console.log('no session when accessing /home')
        setTimeout(() => router.navigateTo('/'), 0);
        return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
    }

	setTimeout(() => {
		passContext(ctx);
		setupGameEventListeners(ctx);
	}, 0);

	const content = /*html*/`
	<div class="flex flex-col min-h-screen">
		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>

		<div class="flex-1 flex flex-col items-center justify-center">
			<!-- Select mode -->
			<h1 class='text-3xl'>Game settings</h1>

			<form id='game-settings'class='flex flex-col gap-10 items-center justify-center mt-20'>
				<fieldset class="flex flex-row mt-5 gap-8 justify-between">
					<legend class="w-full text-center mb-4 text-xl font-[Calistoga] font-medium">Select playing mode</legend>
					<div class="flex-1 h-full">
						<input
						type="radio"
						id="local-mode"
						name="playing_mode"
						value="LOCAL"
						class="hidden peer"
						checked />
						<label for="local-mode" class="${RADIO_LABEL}">
						Local mode
						</label>
					</div>
					<div class="flex-1 h-full">
						<input
						type="radio"
						id="remote-mode"
						name="playing_mode"
						value="REMOTE"
						class="hidden peer" />
						<label for="remote-mode" class="${RADIO_LABEL}">
						Remote
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
				<button type='submit' class='${BUTTON_CREAM_CLASSES}'>CREATE GAME</button>
			</form>

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


	const form = document.querySelector('form[id="game-settings"]') as HTMLFormElement;
	form?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const selectedMode = (document.querySelector('input[name="playing_mode"]:checked') as HTMLInputElement)?.value;
		const scoreToWin = (document.querySelector('input[name="score_to_win"]') as HTMLInputElement)?.value;
		console.log('create game with mode = ', selectedMode, ' and score to win = ', scoreToWin);

		try {
			const result = await gameApi.createGame(ctx.userStore.get()?.accessToken!, selectedMode, parseInt(scoreToWin));
			console.log('result = ', result);
			router.navigateTo(`/game-room/${result.id}`);
		} catch (error) {
			console.log(error);
		}

	})
}
