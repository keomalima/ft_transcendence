import type { AppContext, UserState, GameUsers, GameData } from "../types.js";
import { router } from "../main.js";
import { gameApi } from "../api/gameApi.js";

// import HTML components
import "../components/NavBar.js";
import "../components/PlayersList.js";

let isGenerated: boolean = false;

export function GameRoom(ctx: AppContext, params?: Record<string, string>): string{
	// get user data from store
	const currentUser: UserState | null = ctx.userStore.get();
	// console.log('game room user', currentUser);

	// secure if no access token or user ID
	if (!currentUser?.accessToken || !currentUser?.id)
	{
		console.log('no session when accessing /game-room')
		setTimeout(() => router.navigateTo('/'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	// secure if no params
	if (!params || !params['id'])
	{
		console.log('no params available')
		setTimeout(() => router.navigateTo('/home'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	setTimeout(async () => {
		const gameData = await getGameData(currentUser?.accessToken!, params['id']);
		if (!gameData)
			return;
		const playerList: GameUsers[] | null = gameData.gameUsers;
		renderGameRoomContent(gameData);
		passContext(ctx, gameData, gameData.isCreator);
		await setupGameRoomEventListeners(ctx, params['id']);
	}, 0);


	return `<div id="game-room-content">Loading game data...</div>`;
}

// ======== GET GAME DATA ============
async function getGameData(token: string, id: string): Promise<GameData | null> {

	try {
		const gameData: GameData | null = await gameApi.getGame(token, id);
		return gameData;
	} catch(error) {
		console.log(error);
		return null;
	}
}


// ======== UPDATE CONTENT ============
function renderGameRoomContent(gameData: GameData) {
	const content = document.getElementById('game-room-content');
	if (gameData.isCreator) {
		content!.innerHTML = /*html*/`
			<div class="flex flex-col min-h-screen">
				<header>
					<nav-bar id='nav-bar-component'></nav-bar>
				</header>
				<div class="flex flex-row flex-1 w-full items-center">
					<div class='flex flex-1 flex-col w-full'>
						<h1 class='text-3xl mb-10 text-center'>Waiting room</h1>
						<div class='flex flex-row w-full gap-5 justify-center'>
							<div id='token' class='flex w-1/3 rounded-lg bg-white items-center justify-center'>
								<p id='token-text' class='text-stone-400 text-sm'>generated token</p>
							</div>
							<button id='generate-btn' class='rounded-full bg-black p-3 text-white font-normal hover:shadow-md hover:font-medium focus-visible:outline-2 focus-visible:outline-offset-2'>Generate token</button>
						</div>
						<p id='error-generate-token'></p>
					</div>
					<div class='flex flex-1 items-center justify-center h-full min-h-0'>
						<player-list id='player-list-component' class="w-3/4 rounded-lg bg-white shadow-sm p-4 lg:p-10 order-2 lg:order-0 lg:col-start-3 lg:row-start-3 lg:row-span-3"></player-list>
					</div>
				</div>
			</div>
		`
	} else {
		content!.innerHTML = /*html*/`
			<div class="flex flex-col min-h-screen">
				<header>
					<nav-bar id='nav-bar-component'></nav-bar>
				</header>
				<div class="flex flex-row flex-1 w-full items-center">
					<div class='flex flex-1 flex-col w-full'>
						<h1 class='text-3xl mb-10 text-center'>Waiting room</h1>
					</div>
					<div class='flex flex-1 items-center justify-center h-full min-h-0'>
						<player-list id='player-list-component' class="w-3/4 rounded-lg bg-white shadow-sm p-4 lg:p-10 order-2 lg:order-0 lg:col-start-3 lg:row-start-3 lg:row-span-3"></player-list>
					</div>
				</div>
			</div>
		`
	}

}


// ======== PASS CONTEXT ========
function passContext(ctx: AppContext, gameData: GameData | null, isCreator: boolean | null) {

	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const playerListComponent = document.getElementById('player-list-component') as any;
	if (playerListComponent) {
		playerListComponent.ctx = ctx;
		playerListComponent.isCreator = isCreator;
		playerListComponent.gameData = gameData;
	}

}

// ======== EVENT LISTENER ============
async function setupGameRoomEventListeners(ctx: AppContext, gameId: string) {

	// **** GENERATE TOKEN ****
	const generateBtn = document.querySelector('#generate-btn') as HTMLButtonElement;
	generateBtn?.addEventListener('click', async (e) => {
		e.preventDefault();
		try {
			let result = null;
			if (isGenerated == false) {
				result = await gameApi.generateToken(ctx.userStore.get()?.accessToken!, gameId);
				isGenerated = true;
			}
			if (result) {
				const tokenText = document.getElementById('token-text') as HTMLParagraphElement;
				tokenText.innerText = `${result.token}`;
				tokenText.className = 'text-black';
				generateBtn.innerText = 'Copied';
				generateBtn.className = 'rounded-full bg-muted p-3 text-white font-normal focus-visible:outline-2 focus-visible:outline-offset-2';
				await navigator.clipboard.writeText(`${result.token}`);
			}
		} catch (error) {
			const errorMsgGenerateToken = document.querySelector('#error-generate-token') as HTMLParagraphElement;
			errorMsgGenerateToken.className = 'mt-2 text-red-500'
			errorMsgGenerateToken.innerText = error as string;
			console.log(error);
		}
	});

	// **** START GAME ****
	const playerListComponent = document.getElementById('player-list-component') as any;
	playerListComponent.addEventListener('event-start-game', async (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const gameId = customEvent.detail;
		const accessToken = ctx.userStore.get()?.accessToken;
		if (!accessToken || !gameId)
			return;
		try {
			const result = await gameApi.startGame(accessToken, gameId);
			router.navigateTo('/launch-game');
		} catch (error) {
			const errorMsgStartGame = document.querySelector('#error-start-game') as HTMLParagraphElement;
			errorMsgStartGame.className = 'mt-2 text-red-500'
			errorMsgStartGame.innerText = error as string;
			console.log(error);
		}
	})


}
