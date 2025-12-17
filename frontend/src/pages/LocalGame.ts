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
	id: string;
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
		savedVx: number;
		savedVy: number;
		speed: number;
	}
	nextService : 'left' | 'right';
	scoreToWin: number;
	status: 'waiting' | 'playing' | 'finished' | 'abandoned';
	isPaused: boolean;
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
		

		// 1. Start the gane API
		if (currentGame.status === 'PENDING') {
			try {
				await gameService.startGame(currentGame.id!, ctx);
			} catch (error) {
				console.log(error);
			}
		}

		// 2. Render the initial game (DOM must exist first)
		renderGameContent(params['id'], currentGame!, currentUser);

		// 3. Init the local game config and state
		const game = initGame(currentGame.scoreToWin!, params['id']);
		
		// 4. Start listener (after DOM exists)
		setupLocalGameEventListeners(ctx, game, params['id']);

		// 5. Start game loop + listener for actions
		runGame(game, currentUser, ctx);
	}, 0);

	return (/*html*/`
		<div id="game-content" class="h-screen overflow-hidden">
			<p class='flex items-center justify-center h-screen'>Loading Game ...</p>
		</div>
		`);
}

// ======== UPDDATE CONTENT ============
function renderGameContent(gameId: string, currentGame: GameData, currentUser: UserState) {
	if (!currentGame) {
		console.log('❌ Missing current game');
		return;
	}
	const content = document.getElementById('game-content');
	content!.innerHTML = 
	/*html*/`
		<main class="flex flex-col gap-4 h-full w-screen place-items-center px-6 py-8 lg:py-12 lg:px-12 overflow-y-auto">
			<div class="text-center">
				<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">Local game</h1>
				<p>#${gameId}</p>
			</div>
			<div class='flex flex-row w-full px-12'>
				<div class='flex-1 justify-items-center'>
					<p id='left-player' class='font-[Inter] text-xl'>${currentUser.displayName}</p>
					<p id='left-score' class='font-[Calistoga] text-5xl mt-5'>0</p>
				</div>
				<div class='flex-1 justify-items-center center'>
					<p>vs</p>
				</div>
				<div class='flex-1 justify-items-center'>
					<p id='right-player' class='font-[Inter] text-xl'>Guest</p>
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
			<div id="pause-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Pause</p>
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

// ======== INIT GAME ============
function initGame(scoreToWin: number, gameId: string): LocalGameData {

	const game: LocalGameData = {
		id: gameId,
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
			savedVx: 0,
			savedVy: 0
		},
		nextService: 'left',
		scoreToWin,
		status: 'waiting',
		isPaused: false
	}
	return game;
}

// ======== RUN GAME ============
function runGame(game: LocalGameData, currentUser: UserState, ctx: AppContext) {
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
			
			if (winner && wonGameOverlay) {
				game.scoreL > game.scoreR ? winner.innerText = `${currentUser.displayName} won the game !` : winner.innerText = 'Guest won the game!';
				wonGameOverlay.classList.remove('hidden');
			}			
			return;
		}
		
		calculateGame.calculatePaddle(game, mapKeys);
		calculateGame.calculateBall(game);

		ball.style.left = `${game.ball.x}px`;
		ball.style.top = `${game.ball.y}px`;

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
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			mapKeys.up = true;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			mapKeys.down = true;
		}
    });

    document.addEventListener('keyup', (e) => {
		if (e.key === 's') mapKeys.s = false;
		if (e.key === 'x') mapKeys.x = false;
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			mapKeys.up = false;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			mapKeys.down = false;
		}
    });
}


// ======== EVENT LISTENER ============
function setupLocalGameEventListeners(ctx: AppContext, game: LocalGameData, gameId: string) {
	const playerPauseOverlay = document.querySelector('#pause-overlay') as HTMLDivElement;

	// **** PAUSE ****
	const pauseBtn = document.querySelector('#pause-btn') as HTMLButtonElement;
	pauseBtn?.addEventListener('click', (e: Event) => {
		e.preventDefault();
		
		game.isPaused = true;
		game.ball.savedVx = game.ball.vx;
		game.ball.savedVy = game.ball.vy;
		game.ball.vx = 0;
		game.ball.vy = 0;
		game.paddleSpeed = 0;
		playerPauseOverlay?.classList.remove('hidden');
	});

	// **** RESUME GAME ****
	const stopPauseBtn = document.querySelector('#stop-pause-btn') as HTMLButtonElement;
	stopPauseBtn.addEventListener('click', (e) => {
		e.preventDefault();

		game.isPaused = false;
		
		if (game.ball.savedVx === 0 && game.ball.savedVy === 0) {
			calculateGame.service(game);
		} else {
			game.ball.vx = game.ball.savedVx;
			game.ball.vy = game.ball.savedVy;
			game.ball.savedVx = 0;
			game.ball.savedVy = 0;
		}
		
		game.paddleSpeed = 10;
		playerPauseOverlay?.classList.add('hidden');
	});


	// **** QUIT GAME ****
	const quitBtn = document.getElementById('quit-btn');
	quitBtn?.addEventListener('click', (e) => {
		e.preventDefault();

		const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;
		if (!quitDialog)
			return;

		quitDialog.showModal();
		const cancelBtn = document.querySelector('#cancel-quit-btn') as HTMLButtonElement;
		const confirmBtn = document.querySelector('#confirm-quit-btn') as HTMLButtonElement;

		// Handle cancel
		const handleCancel = () => {
			quitDialog.close();
			cancelBtn?.removeEventListener('click', handleCancel);
			confirmBtn?.removeEventListener('click', handleConfirm);
		};
		
		// Handle confirm
		const handleConfirm = async () => {
			console.log('quit game trigger');
			quitDialog.close();
			cancelBtn?.removeEventListener('click', handleCancel);
			confirmBtn?.removeEventListener('click', handleConfirm);
			game.status = 'abandoned';
			const currentGame = await gameService.getGame(gameId, ctx);
			if (!currentGame || !currentGame.gameUsers || currentGame.gameUsers?.length < 2)
				return;
			try {
				const data: FinishGameDto = {
					status: 'ABANDONED',
					gamePlayers: [
						{
							playerId: currentGame.gameUsers[0].id!,
							score: currentGame.gameUsers[0].user?.id === ctx.userStore.get()?.id ? game.scoreL : game.scoreR
						},
						{
							playerId: currentGame.gameUsers[1].id!,
							score: currentGame.gameUsers[1].user?.id === ctx.userStore.get()?.id ? game.scoreR : game.scoreL
						}
					]
				};
				await gameService.finishGame(currentGame.id!, data, ctx);
				console.log('✅ Game finished successfully');
				router.navigateTo('/home');
			} catch (error) {
				console.log(error);
			}
			router.navigateTo('/home');
		};

		// Attach event listeners
		cancelBtn?.addEventListener('click', handleCancel);
		confirmBtn?.addEventListener('click', handleConfirm);
		
		// Close on backdrop click
		quitDialog.addEventListener('click', (e) => {
			if (e.target === quitDialog) {
				handleCancel();
			}
		});
	});

	// **** WON GAME ****
	window.addEventListener('event-game-completed', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const { finalGame } = customEvent.detail;
		
		try {
			const currentGame = await gameService.getGame(finalGame.id, ctx);
			if (!currentGame || !currentGame.gameUsers || currentGame.gameUsers?.length < 2)
				return;
			
			// Find which gameUser is the current user and which is the guest
			const currentUserId = ctx.userStore.get()?.id;
			const currentUserGamePlayer = currentGame.gameUsers.find(gu => gu.user?.id === currentUserId);
			const guestGamePlayer = currentGame.gameUsers.find(gu => gu.user?.id !== currentUserId);
			
			if (!currentUserGamePlayer || !guestGamePlayer) {
				console.error('Failed to identify players');
				return;
			}
			
			const data: FinishGameDto = {
				status: 'COMPLETED',
				gamePlayers: [
					{
						playerId: currentUserGamePlayer.id!,
						score: finalGame.scoreL
					},
					{
						playerId: guestGamePlayer.id!,
						score: finalGame.scoreR
					}
				]
			};
			await gameService.finishGame(currentGame.id!, data, ctx);
			console.log('✅ Game finished successfully');
		} catch (error) {
			console.error('Failed to finish game:', error);
		}
	});

	// **** BACK HOME ****
	const backHomeBtn = document.querySelector('#won-back-home-btn') as HTMLButtonElement;
	backHomeBtn?.addEventListener('click', async () => {
		
		// need to end the game (API) ===================================================================
		router.navigateTo('/home');
	}, { once: true });
}