import { router } from "../main.js";
import type { AppContext, GameData, UserState } from "../types.js";
import { BUTTON_CREAM_CLASSES, BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { gameService } from "../services/GameService.js";
import { getGameValue } from "../localGameAlgo/getGameValue.js";
import { calculateGame } from "../localGameAlgo/calculateGame.js";
import { FinishGameDto } from "../api/gameApi.js";

export interface MapKeys {
	s: boolean;
	x: boolean;
	up: boolean;
	down: boolean
}

export interface LocalGameData {
	paddleL: number;
	paddleR: number;
	scoreL: number;
	scoreR: number;
	paddleSpeed: number;
	ball: {
		x: number;
		y: number;
		vx: number;
		vy: number;
		speed: number;
	}
	nextService : 'left' | 'right';
	scoreToWin: number;
	status: 'waiting' | 'playing' | 'finished' | 'abandoned';
}

export function LocalGame(ctx: AppContext, params?: Record<string, string>): string {

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
		let currentGame = await gameService.getGame(params['id'], ctx);
		console.log('💫 current game = ', currentGame);
		if (!currentGame || currentGame.status === 'ABANDONED' || currentGame.status === 'COMPLETED' || !currentUser.id) {
			setTimeout(() => router.navigateTo('/'), 0);
			return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
		}
		let check = await userIsAuthorized(currentUser.id!, ctx);
		if (check !== null)
			return check;
		
		// try {
		// 	await gameService.startGame(currentGame.id!, ctx);
		// } catch (error) {
		// 	console.log(error);
		// }

		// 1. Render the initial game (DOM must exist first)
		renderGameContent(params['id'], currentGame!);
		
		// 2. Start listener for action up and down arrows (after DOM exists)
		runGame(currentGame.scoreToWin!, currentUser);

		// try {
		// 	// const data: FinishGameDto = {
		// 	// 	status: 'COMPLETED',
		// 	// 	gamePlayers: [
		// 	// 		{
		// 	// 			playerId: currentGame.gameUsers[0].id!,
		// 	// 			score: currentGame.gameUsers[0].user?.id === detail.players[0].id ? parseInt(detail.players[0].score!) : parseInt(detail.players[1].score!)
		// 	// 		},
		// 	// 		{
		// 	// 			playerId: currentGame.gameUsers[1].id!,
		// 	// 			score: currentGame.gameUsers[1].user?.id === detail.players[1].id ? parseInt(detail.players[1].score!) : parseInt(detail.players[0].score!)
		// 	// 		}
		// 	// 	]
		// 	// };
		// 	// await gameService.finishGame(currentGame.id!, data, ctx);
		// 	console.log('✅ Game finished successfully');
		// 	router.navigateTo('/home');
		// } catch (error) {
		// 	console.log(error);
		// }
		
	}, 0);

	return (/*html*/`
		<div id="game-content">
			<p class='flex items-center justify-center h-screen'>Loading Game ...</p>
		</div>
		`);
}

// ======== UPDDATE CONTENT ============
function renderGameContent(gameId: string, currentGame: GameData) {
	if (!currentGame) {
		console.log('❌ Missing current game');
		return;
	}
	const content = document.getElementById('game-content');
	content!.innerHTML = 
	/*html*/`
		<main class="flex flex-col gap-8 min-h-full w-screen place-items-center px-6 lg:py-32 lg:px-12">
			<div class="text-center">
				<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">Local game</h1>
				<p>#${gameId}</p>
			</div>
			<div class='flex flex-row w-full px-12'>
				<div class='flex-1 justify-items-center'>
					<p id='left-player' class='font-[Inter] text-xl'>player 1</p>
					<p id='left-score' class='font-[Calistoga] text-5xl mt-5'>0</p>
				</div>
				<div class='flex-1 justify-items-center center'>
					<p>vs</p>
				</div>
				<div class='flex-1 justify-items-center'>
					<p id='right-player' class='font-[Inter] text-xl'>player 2</p>
					<p id='right-score' class='font-[Calistoga] text-5xl mt-5'>0</p>
				</div>
			</div>
			<div id="arena" class='w-full xl:w-[80%] mx-auto aspect-[2/1] bg-black relative border-2 border-black rounded-xl'>
				<div id="line" class='absolute w-[1px] h-full bg-white' style='left: 50%'></div>
				<div id="paddleLeft" class='absolute w-[2%] h-1/5 bg-white rounded-xs' style="top: 40%"></div>
				<div id="paddleRight" class='absolute w-[2%] h-1/5 bg-white right-[0px] rounded-xs' style="top: 40%"></div>
				<div id='ball' class='absolute w-[2.5%] h-[5%] rounded-full bg-yellow-500' style="top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
			</div>
			<div class="text-center">
				<div class="mt-10 flex items-center justify-center gap-x-6">
					<button id='pause-btn' type='click' class='${BUTTON_CREAM_CLASSES}'>pause</button>
					<button id='quit-btn' type='click' class='${BUTTON_CREAM_CLASSES}'>give up</button>
				</div>
			</div>

			<!-- Start message overlay -->
			<div id="start-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-black text-black">Your game will start soon</p>
						<p id='start-side' class="text-3xl font-[Calistoga] text-black"></p>
					</div>
				</div>
			</div>


			<!-- Pause overlay -->
			<div id="player-set-pause-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Pause</p>
						<p id='player-pause-timer' class="text-3xl font-[Inter] font-light text-black"></p>
						<button id='stop-pause-btn' type='click' class='${BUTTON_WHITE_CLASSES}'>Go!</button>
					</div>
				</div>
			</div>

			<!-- Won game overlay -->
			<div id="won-game-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Finish Game</p>
						<p class="text-5xl font-[Calistoga] font-black text-black" id="winner"></p>
						<button id='won-back-home-btn' class='${BUTTON_WHITE_CLASSES}'>Back to home</button>
					</div>
				</div>
			</div>

			<!-- Confirmation Dialog -->
			<dialog id="quit-game-dialog" class="rounded-lg shadow-lg p-6 backdrop:bg-black backdrop:bg-opacity-50">
				<div class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold">Give up</h2>
					<p id="delete-friend-message" class="text-gray-600">Are you sure to quit game?</p>
					<div class="flex gap-3 justify-end">
						<button id="cancel-quit-btn" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
						<button id="confirm-quit-btn" class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white">Confirm</button>
					</div>
				</div>
			</dialog>
		</main>
	`;
}

// ======== CHECK IF USER IS AUTHORIZED ============
async function userIsAuthorized(userId: string, ctx: AppContext): Promise<string | null>
{
	const gameData = await gameService.getCurrentGame(ctx);
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
	console.log('user is authorized');
	return null;
}


function runGame(scoreToWin: number, currentUser: UserState) {
	const mapKeys: MapKeys = {
		s: false,
		x: false,
		up: false,
		down: false
	}
	gameActionListener(mapKeys);

	const paddleRight = document.getElementById('paddleRight') as HTMLDivElement;
	const paddleLeft = document.getElementById('paddleLeft') as HTMLDivElement;
	const ball = document.getElementById('ball') as HTMLDivElement;
	const leftScore = document.getElementById('left-score') as HTMLParagraphElement;
	const rightScore = document.getElementById('right-score') as HTMLParagraphElement;

	const game: LocalGameData = {
		paddleL: (getGameValue.arenaHeight() - getGameValue.paddleHeight()) / 2,
		paddleR: (getGameValue.arenaHeight() - getGameValue.paddleHeight()) / 2,
		scoreL: 0,
		scoreR: 0,
		paddleSpeed: 10,
		ball: {
			x: getGameValue.arenaWidth() / 2,
			y: getGameValue.arenaHeight() / 2,
			vx: 0,
			vy: 0,
			speed: 10,
		},
		nextService: 'left',
		scoreToWin,
		status: 'waiting'
	}

	// Wait for next frame to ensure DOM is fully rendered with correct dimensions
	requestAnimationFrame(() => {
		game.paddleL = (getGameValue.arenaHeight() - getGameValue.paddleHeight()) / 2;
		game.paddleR = (getGameValue.arenaHeight() - getGameValue.paddleHeight()) / 2;
		game.ball.x = getGameValue.arenaWidth() / 2;
		game.ball.y = getGameValue.arenaHeight() / 2;
		
		// Set initial centered positions
		paddleLeft.style.top = `${game.paddleL}px`;
		paddleRight.style.top = `${game.paddleR}px`;
		ball.style.left = `${game.ball.x}px`;
		ball.style.top = `${game.ball.y}px`;
		
		// Start the game loop after initialization
		calculateGame.service(game);
		game.status = 'playing';
		gameLoop();
	});

	function gameLoop() {

		if (game.status === 'finished' || game.status === 'abandoned') {
			console.log('game over');
			const wonGameOverlay = document.getElementById('won-game-overlay') as HTMLDivElement;
			const winner = document.getElementById('winner') as HTMLParagraphElement;
			
			game.scoreL > game.scoreR ? winner.innerText = `${currentUser.displayName} won the game !` : 'Guest won the game!';
			wonGameOverlay?.classList.remove('hidden');
			return;
		}
		
		calculateGame.calculatePaddle(game, mapKeys);
		calculateGame.calculateBall(game);

		// --- RENDER BALL ---
		ball.style.left = `${game.ball.x}px`;
		ball.style.top = `${game.ball.y}px`;

		// --- RENDER SCORE ---
		leftScore.innerText = game.scoreL.toString();
		rightScore.innerText = game.scoreR.toString();

		requestAnimationFrame(gameLoop);
	}
}


// ======== GAME ACTION ============
function gameActionListener(mapKeys: MapKeys) {
	document.addEventListener('keydown', (e) => {
		if (e.key === 's') mapKeys.s = true;
		if (e.key === 'x') mapKeys.x = true;
		if (e.key === 'ArrowUp') mapKeys.up = true;
		if (e.key === 'ArrowDown') mapKeys.down = true;
    });

    document.addEventListener('keyup', (e) => {
		if (e.key === 's') mapKeys.s = false;
		if (e.key === 'x') mapKeys.x = false;
		if (e.key === 'ArrowUp') mapKeys.up = false;
		if (e.key === 'ArrowDown') mapKeys.down = false;
    });
}



