import { gameApi } from "../api/gameApi.js";
import { router } from "../main.js";
import type { AppContext } from "../types.js";
import { GameConnection } from "../websocket/GameConnection.js";
import { BUTTON_BLACK_CLASSES, BUTTON_CREAM_CLASSES } from "../styles/tailwindStyles.js";


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
		// renderGameContent(params['id']);
		let check = await userIsAuthorized(currentUser.id!);
		if (check !== null)
			return check;
		game();
		setGameSockets(params['id'], currentUser.id!);
		setupLaunchGameEventListeners();
	}, 0);

	return (/*html*/`
		<div id="game-content">
			<p class='flex items-center justify-center h-screen'>Loading Game ...</p>
		</div>
		`);
}

// ======== UPDDATE CONTENT ============
function renderGameContent(gameId: string) {
	const content = document.getElementById('game-content');

	content!.innerHTML = 
	/*html*/`
		<main class="flex flex-col gap-8 min-h-full w-screen place-items-center px-6 lg:py-32 lg:px-12">
			<div class="text-center">
				<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">Game</h1>
				<p>#${gameId}</p>
			</div>
			<div class='flex flex-row w-full px-12'>
				<div class='flex-1 justify-items-center'>
					<p id='right-player' class='font-[Inter] text-xl'>player 1</p>
					<p id='right-score' class='font-[Calistoga] text-5xl mt-5'>0</p>
				</div>
				<div class='flex-1 justify-items-center center'>
					<p>vs</p>
				</div>
				<div class='flex-1 justify-items-center'>
					<p id='left-player' class='font-[Inter] text-xl'>player 2</p>
					<p id='left-score' class='font-[Calistoga] text-5xl mt-5'>0</p>
				</div>
			</div>
			<div id="arena" class='w-full mx-auto aspect-[2/1] bg-black relative border border-2 border-black rounded-xl'>
				<div id="line" class='absolute w-[1px] h-full bg-white' style='left: 50%'></div>
				<div id="paddleLeft" class='absolute w-[2%] h-1/5 bg-white rounded-xs' style="top: 40%"></div>
				<div id="paddleRight" class='absolute w-[2%] h-1/5 bg-white right-[0px] rounded-xs' style="top: 40%"></div>
				<div id='ball' class='absolute w-[2.5%] h-[5%] rounded-full bg-yellow-500' style="top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
			</div>
			<div class="text-center">
				<div class="mt-10 flex items-center justify-center gap-x-6">
					<button id='quit-btn' class='${BUTTON_CREAM_CLASSES}'>give up</button>
				</div>
			</div>

			<!-- Dialog for countdown -->
			<dialog id="countdown-dialog" class="bg-white-500 focus:border-none focus:outline-none">
				<div class="shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Get Ready</p>
						<p class="text-8xl font-[Calistoga] font-black text-black animate-pulse" id="countdown-number">3</p>
					</div>
				</div>
			</dialog>

			<!-- Dialog for won game -->
			<dialog id="won-game-dialog" class="bg-white-500 focus:border-none focus:outline-none">
				<div class="shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Finish Game</p>
						<p class="text-8xl font-[Calistoga] font-black text-black animate-pulse" id="winner">??</p>
					</div>
				</div>
			</dialog>

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

function getGameWidth(): number
{
	const gameArea = document.getElementById("arena")
	return (gameArea!.clientWidth);
}


function game() {

	const mapKeys = {'ArrowUp': false, 'ArrowDown': false }

	function isValidKey(key: string): key is keyof typeof mapKeys {
		return key in mapKeys;
	}

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
		
		// Query elements each time (they're created by renderGameContent)
		const paddleLeft = document.getElementById('paddleLeft');
		const paddleRight = document.getElementById('paddleRight');
		const ball = document.getElementById('ball');
		const leftPlayer = document.getElementById('left-player') as HTMLParagraphElement;
		const rightPlayer = document.getElementById('right-player') as HTMLParagraphElement;
		const leftScore = document.getElementById('left-score') as HTMLParagraphElement;
		const rightScore = document.getElementById('right-score') as HTMLParagraphElement;
		
		if (!paddleLeft || !paddleRight || !ball) return;
		
		paddleLeft.style.top = `${parseInt(data.left.paddleposition) * getGameHeight() / 100}px`;
		paddleRight.style.top = `${parseInt(data.right.paddleposition) * getGameHeight() / 100}px`;
		ball.style.left = `${parseInt(data.ballX) * getGameWidth() / 200}px`;
		ball.style.top = `${parseInt(data.ballY) * getGameHeight() / 100}px`;
		ball.style.transform = 'translate(-50%, -50%)';
		leftPlayer.innerText = data.left.userid;
		leftScore.innerText = data.left.score;
		rightPlayer.innerText = data.right.userid;
		rightScore.innerText = data.right.score;
	})
}

// ======== EVENT LISTENER ============
function setupLaunchGameEventListeners() {

	// **** START GAME ****
	document.addEventListener('event-start-game', (e: Event) => {
		e.preventDefault();
		console.log('event listener START');
		const customEvent = e as CustomEvent;
		const detail = customEvent.detail;
		renderGameContent(detail.gameId);
		setupLaunchGameEventListeners();
	})

	// **** START GAME ****
	document.addEventListener('event-won-game', (e: Event) => {
		e.preventDefault();
		console.log('event listener WON GAME');
		const customEvent = e as CustomEvent;
		const detail = customEvent.detail;

		const wonGameDialog = document.querySelector('#won-game-dialog') as HTMLDialogElement;
		const winner = document.querySelector('#winner') as HTMLParagraphElement;

		if (!wonGameDialog || !winner)
			return;

		winner.innerText = detail.winner;
		wonGameDialog.showModal();
	})

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
		const handleConfirm = () => {
			quitDialog.close();
			cancelBtn?.removeEventListener('click', handleCancel);
			confirmBtn?.removeEventListener('click', handleConfirm);

			cleanGameWS();
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

	// **** COUNTDOWN ****
	document.addEventListener('event-service-countdown', (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;

		const countdownDialog = document.querySelector('#countdown-dialog') as HTMLDialogElement;
		const countdownNumber = document.querySelector('#countdown-number') as HTMLParagraphElement;
		const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;

		if (!countdownDialog || !countdownNumber || !quitDialog)
			return;

		// Don't show countdown if quit dialog is open
		if (quitDialog?.open) {
			return;
		}

		countdownDialog?.addEventListener('cancel', (event) => {
			event.preventDefault();
		});

		let count = data.count;

		countdownDialog?.showModal();
		countdownNumber.textContent = count.toString();

		const interval = setInterval(() => {
			count--;
			if (count > 0) {
				countdownNumber.textContent = count.toString();
			} else {
				countdownNumber.textContent = 'GO!';
				setTimeout(() => {
					countdownDialog?.close();
				}, 800);
				clearInterval(interval);
			}
		}, 1000);
		
	})
}