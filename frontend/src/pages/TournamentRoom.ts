import type { AppContext, TournamentData, UserState } from "../types.js";
import { router } from "../main.js";
import { tournamentApi } from "../api/tournamentApi.js";
import { TournamentWaitingRoomConnection } from "../websocket/TournamentWaitingConnections.js";
import type { TournamentPlayerList } from "../components/TournamentPlayerList.js";

// Import components
import "../components/NavBar.js";
import "../components/TournamentPlayerList.js";

let isGenerated: boolean = false;
let wsConnection: TournamentWaitingRoomConnection | null = null;

export function TournamentRoom(ctx: AppContext, params?: Record<string, string>): string{
	// get user data from store
	const currentUser: UserState | null = ctx.userStore.get();
	// console.log('game room user', currentUser);

	// secure if no params
	if (!params || !params['id'])
	{
		console.log('no params available')
		setTimeout(() => router.navigateTo('/home'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	setTimeout(async () => {
		let tournamentData = await getTournamentData(params['id']);
		if (!tournamentData)
			return;
		renderTournamentRoomContent(tournamentData);
		passContext(ctx, tournamentData, tournamentData.isCreator);

		setTournamentRoomWebSockets(currentUser!, tournamentData);
		await setupGameRoomEventListeners(ctx, params['id']);
	}, 0)

	return (/*html*/`
		<div id="tournament-room-content">
			<p class='flex items-center justify-center h-screen'>Loading Tournament Room...</p>
		</div>
	`);
}

// ======== UPDATE CONTENT ============
function renderTournamentRoomContent(tournamentData: TournamentData) {
	const content = document.getElementById('tournament-room-content');
	if (tournamentData.isCreator) {
		content!.innerHTML = /*html*/`
			<div class="flex flex-col min-h-screen">
				<header>
					<nav-bar id='nav-bar-component'></nav-bar>
				</header>
				<div class="flex flex-col lg:flex-row flex-1 w-full items-center gap-8 lg:gap-0 p-4 lg:p-0">
					<div class='flex lg:flex-1 flex-col w-full'>
						<h1 class='text-3xl mb-10 text-center'>Waiting room</h1>
						<div class='flex flex-row w-full gap-5 justify-center items-center'>
							${tournamentData.token ? 
								`<div id='token' class='flex w-full sm:w-2/3 lg:w-1/3 rounded-lg bg-white items-center justify-center p-4'>
									<p id='token-text' class='text-black text-sm'>${tournamentData.token}</p>
								</div>
								<button id='copy-btn' class='rounded-full bg-black p-3 text-white font-normal hover:shadow-md hover:font-medium focus-visible:outline-2 focus-visible:outline-offset-2'>Copy</button>
								`
								: 
								`<div id='token' class='flex w-full sm:w-2/3 lg:w-1/3 rounded-lg bg-white items-center justify-center p-4'>
									<p id='token-text' class='text-stone-400 text-sm'>generated token</p>
								</div>
								<button id='generate-btn' class='rounded-full bg-black p-3 text-white font-normal hover:shadow-md hover:font-medium focus-visible:outline-2 focus-visible:outline-offset-2'>Generate token</button>
								`}
						</div>
						<p id='error-generate-token'></p>
					</div>
					<div class='flex lg:flex-1 items-center justify-center w-full lg:w-auto h-auto lg:h-full min-h-0'>
						<tournament-player-list id='tournament-player-list-component' class="w-full lg:w-3/4 rounded-lg bg-white shadow-sm p-4 lg:p-10 order-2 lg:order-0 lg:col-start-3 lg:row-start-3 lg:row-span-3"></tournament-player-list>
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
				<div class="flex flex-col lg:flex-row flex-1 w-full items-center gap-8 lg:gap-0 p-4 lg:p-0">
					<div class='flex lg:flex-1 flex-col w-full'>
						<h1 class='text-3xl mb-10 text-center'>Waiting room</h1>
					</div>
					<div class='flex lg:flex-1 items-center justify-center w-full lg:w-auto h-auto lg:h-full min-h-0'>
						<tournament-player-list id='tournament-player-list-component' class="w-full lg:w-3/4 rounded-lg bg-white shadow-sm p-4 lg:p-10 order-2 lg:order-0 lg:col-start-3 lg:row-start-3 lg:row-span-3"></tournament-player-list>
					</div>
				</div>
			</div>
		`
	}

}

// ======== SET WEBSOCKET CONNECTION ============
async function setTournamentRoomWebSockets(currentUser: UserState, tournamentData: TournamentData) {

	// Create websocket with gameid
	wsConnection = new TournamentWaitingRoomConnection();
	wsConnection.connect(tournamentData.id!, currentUser.id!,
		async (updateGameData) => {
			if (updateGameData.message) {
				console.log('🔔', updateGameData);
				const newTournamentData = await getTournamentData(tournamentData.id!);
				if (newTournamentData)
					tournamentData = newTournamentData;
				updatePlayerList(tournamentData);
			}
		},
		() => {
			cleanWaitingRoomWS();
			router.navigateTo('/home');
		},
		() => {
			cleanWaitingRoomWS();
			router.navigateTo('/home');
		},
		() => {
			cleanWaitingRoomWS();
			router.navigateTo(`/game/${tournamentData.id}`)
		}
	)
}

// ======== GET TOURNAMENT DATA ============
async function getTournamentData(id: string): Promise<TournamentData | null> {

	try {
		const tournamentData: TournamentData | null = await tournamentApi.getTournament(id);
		return tournamentData;
	} catch(error) {
		console.log(error);
		return null;
	}
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext, tournamentData: TournamentData | null, isCreator: boolean | null) {

	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const tournamentPlayerListComponent = document.getElementById('tournament-player-list-component') as any;
	if (tournamentPlayerListComponent) {
		tournamentPlayerListComponent.ctx = ctx;
		tournamentPlayerListComponent.isCreator = isCreator;
		tournamentPlayerListComponent.tournamentData = tournamentData;
		console.log('✅ Context passed to tournament player list');
	} else {
		console.error('❌ Tournament player list component not found!');
	}
}

// ======== UPDATE PLAYER LIST ============
function updatePlayerList(tournamentData: TournamentData) {
	const tournamentPlayerListComponent = document.getElementById('tournament-player-list-component') as TournamentPlayerList | null;
	if (tournamentPlayerListComponent && tournamentData) {
		// Update the tournamentData property with the new data from websocket
		tournamentPlayerListComponent.tournamentData = tournamentData;
	}
}

// ======== CLEANUP WEBSOCKET CONNECTION ============
export function cleanWaitingRoomWS() {
	if (wsConnection) {
		wsConnection.disconnect();
		wsConnection = null;
	}
}

// ======== EVENT LISTENER ============
async function setupGameRoomEventListeners(ctx: AppContext, tournamentId: string) {

	// **** GENERATE TOKEN ****
	const generateBtn = document.querySelector('#generate-btn') as HTMLButtonElement;
	generateBtn?.addEventListener('click', async (e) => {
		e.preventDefault();
		try {
			let result = null;
			if (isGenerated == false) {
				result = await tournamentApi.generateToken(tournamentId);
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

	// **** COPY TOKEN ****
	const copyBtn = document.querySelector('#copy-btn') as HTMLButtonElement;
	copyBtn?.addEventListener('click', async (e) => {
		e.preventDefault();
		try {
			copyBtn.innerText = 'Copied';
			copyBtn.className = 'rounded-full bg-muted p-3 text-white font-normal focus-visible:outline-2 focus-visible:outline-offset-2';
			const tokenText = document.querySelector('#token-text') as HTMLParagraphElement;
			await navigator.clipboard.writeText(`${tokenText!.innerText}`);
		} catch (error) {
			const errorMsgGenerateToken = document.querySelector('#error-generate-token') as HTMLParagraphElement;
			errorMsgGenerateToken.className = 'mt-2 text-red-500'
			errorMsgGenerateToken.innerText = error as string;
			console.log(error);
		}
	});

	// // **** START TOURNAMENT ****
	const tournamentPlayerListComponent = document.getElementById('tournament-player-list-component') as any;
	tournamentPlayerListComponent?.addEventListener('event-start-tournament', async (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const tournamentId = customEvent.detail;
		try {
			await tournamentApi.startTournament(tournamentId);
			cleanWaitingRoomWS();
			router.navigateTo(`/tournament/${tournamentId}`);
		} catch (error) {
			const errorMsgStartGame = document.querySelector('#error-start-tournament') as HTMLParagraphElement;
			if (errorMsgStartGame) {
				errorMsgStartGame.className = 'mt-2 text-red-500'
				errorMsgStartGame.innerText = error as string;
			}
			console.log(error);
		}
	})

	// // **** QUIT TOURNAMENT ****
	tournamentPlayerListComponent?.addEventListener('event-quit-tournament', async (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const tournamentId = customEvent.detail;
		if (!tournamentId)
			return;
		try {
			await tournamentApi.quitTournament(tournamentId);
			cleanWaitingRoomWS();
			router.navigateTo('/tournament');
		} catch (error) {
			console.log(error);
		}
	})

	// **** REMOVE PLAYER ****
	tournamentPlayerListComponent?.addEventListener('event-remove-player', async (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const tournamentId = customEvent.detail.tournamentId;
		const playerId = customEvent.detail.playerId;

		console.log('Removing player with ID:', playerId);
		if (!tournamentId || !playerId)
			return;
		try {
			await tournamentApi.removePlayer(tournamentId, playerId);
			const tournamentData = await getTournamentData(tournamentId);
			if (tournamentData)
				updatePlayerList(tournamentData);
		} catch (error) {
			console.log(error);
		}
	})
}