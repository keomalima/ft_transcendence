import { gameApi } from "../api/gameApi.js";
import { router } from "../main.js";
import type { AppContext } from "../types.js";
import { GameConnection } from "../websocket/GameConnection.js";


let gameConnection: GameConnection | null = null;

export function Game(ctx: AppContext, params?: Record<string, string>): string {

	// get user data from store
	const currentUser = ctx.userStore.get();

	// secure if no access token or user ID
	if (!currentUser?.id)
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
		let check = await userIsAuthorized(currentUser.id!);
		if (check !== null)
			return check;
		game();
		setGameSockets(params['id'], currentUser.id!);
		setupLaunchGameEventListeners();
	}, 0);

	const content: string = 
	/*html*/`
		<main class="grid min-h-full w-screen place-items-center px-6 py-24 sm:py-32 lg:px-8">
			<div class="text-center">
				<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">Game</h1>
				<p>#${params['id']}</p>
				<div class="mt-10 flex items-center justify-center gap-x-6">
					<button id='back-btn' class="styled-link">Go back home</button>
				</div>
			</div>
			<div id="arena" class='w-full h-[50vw] bg-black relative m-50 border border-2 border-black '>
				<div id="paddleLeft" class='absolute w-[14px] h-1/5 bg-white left-[10px]' style="top: 40%"></div>

				<div id="paddleRight" class='absolute w-[14px] h-1/5 bg-white right-[10px]' style="top: 40%"></div>
			</div>
		</main>
	`;

	return content;
}

// ======== CHECK IF USER IS AUTHORIZED ============
async function userIsAuthorized(userId: string): Promise<string | null>
{
	const gameData = await gameApi.getCurrentGame();
	if (userId !== gameData?.userId) {
		return (
			/*html*/`
				<main class="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
					<div class="text-center">
						<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">You're not allowed in this game</h1>
						<div class="mt-10 flex items-center justify-center gap-x-6">
							<button id='back-btn' class="styled-link">Go back</button>
						</div>
					</div>
				</main>
			`
		)
	}
	return null;
}


// ======== SET WEBSOCKET CONNECTION ============
async function setGameSockets(gameId: string, userId: string) {

	// Create websocket
	gameConnection = new GameConnection();
	gameConnection.connect(gameId, userId);
}

// ======== CLEANUP WEBSOCKET CONNECTION ============
export function cleanGameWS() {
	if (gameConnection) {
		gameConnection.disconnect();
		gameConnection = null;
	}
}

// ======== GAME ACTION ============
function getGameHeight(): number
{
	const gameArea = document.getElementById("arena")
	return (gameArea!.clientHeight);
}


function game() {

	const mapKeys = {'ArrowUp': false, 'ArrowDown': false }

	function isValidKey(key: string): key is keyof typeof mapKeys {
		return key in mapKeys;
	}

	let paddleRight = document.getElementById('paddleRight');
	let paddleLeft = document.getElementById('paddleLeft');

	document.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowUp') {
			gameConnection?.send({ type: 'input', action: 'up' });
		} else if (e.key === 'ArrowDown') {
			gameConnection?.send({ type: 'input', action: 'down' });
		}
	});

	document.addEventListener('keyup', (e) => {
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			gameConnection?.send({ type: 'input', action: 'stop' });
		}
	});

	document.addEventListener('event-update-game', (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		paddleLeft!.style.top = `${parseInt(data.leftPaddle) * getGameHeight() / 100}px`;
		paddleRight!.style.top = `${parseInt(data.rightPaddle) * getGameHeight() / 100}px`;
	})
}

// ======== EVENT LISTENER ============
function setupLaunchGameEventListeners() {

	// **** QUIT GAME ****
	const backBtn = document.getElementById('back-btn');
	backBtn?.addEventListener('click', (e) => {
		e.preventDefault();
		cleanGameWS();
		
		router.navigateTo('/home');
	});
}