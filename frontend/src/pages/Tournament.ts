import { AppContext, TournamentData, TournamentGame, UserState } from "../types.js";
import { router } from "../main.js";

// import HTML components
import "../components/NavBar.js";
import "../components/TournamentBracket.js";
import "../components/TournamentNextGame.js";

// import styles
import { tournamentApi } from "../api/tournamentApi.js";
import { WaitingRoomConnection } from "../websocket/WaitingRoomConnection.js";
import { TournamentNextGame } from "../components/TournamentNextGame.js";
import { TournamentWsConnection } from "../websocket/TournamentConnection.js";

let wsConnection: WaitingRoomConnection | null = null;
let tournamentWsConnection: TournamentWsConnection | null = null;

export function Tournament(ctx: AppContext, params?: Record<string, string>): string {
	//get user data from store
	const currentUser: UserState | null = ctx.userStore.get();
	
	// secure if no params
	if (!params || !params['id'])
	{
		console.log('no params available')
		setTimeout(() => router.navigateTo('/home'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	setTimeout(async () => {
		const currentTournament = await getCurrentTournament();
		const tournamentGames = await getTournamentGames(params['id']);
		if (currentTournament?.status === 'REGISTRATION') {
			setTimeout(() => router.navigateTo(`/tournament-room/${params['id']}`), 0);
		}
		renderTournamentContent(currentTournament);
		passContext(ctx, tournamentGames, currentTournament);

		setGameRoomWebSockets(currentUser!, tournamentGames!, ctx);

		setupTournamentEventListeners(ctx);
	}, 0);

	return (/*html*/`
		<div id="tournament-content">
			<p class='flex items-center justify-center h-screen'>Loading tournament data...</p>
		</div>
	`);
}

function renderTournamentContent(tournament: Partial<TournamentData | null>) {
	const content = document.getElementById('tournament-content');
	content!.innerHTML = /*html*/`
	<div class="flex flex-col min-h-screen">
	    <header>
	        <nav-bar id='nav-bar-component'></nav-bar>
	    </header>
	
	    <div class="flex-1 flex flex-col items-center justify-center h-full px-4 py-8">
	        <div class="text-center mb-2">
	            <h1 class="text-5xl font-bold text-gray-800 mb-4">Tournament</h1>
				<h3 class=" text-gray-500 mb-4">Round ${tournament?.currentRound}</h3>
	        </div>
			<div class="w-full overflow-x-auto">
				<tournament-next-game id='tournament-next-game-component'></tournament-next-game>
			</div>
	        <div class="w-full overflow-x-auto">
	            <tournament-bracket id='tournament-game-component'></tournament-bracket>
	        </div>

	    </div>
	</div>
	`
	showNotification('teste')
	return content;
}

// ======== GET TOURNAMENT GAMES ============
function showNotification(message: string) {
    const container = document.getElementById('tournament-notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.textContent = message;
	notification.className = 'text-sm text-gray-400 italic mb-4';
    
    container.appendChild(notification);
    
    // setTimeout(() => {
    //     notification.style.opacity = '0';
    //     notification.style.transition = 'opacity 300ms';
    //     setTimeout(() => notification.remove(), 300);
    // }, 3000);
}

// ======== GET TOURNAMENT GAMES ============
async function getTournamentGames(tournamentId: string): Promise<TournamentGame[] | null > {
	try {
		const tournamentGames = await tournamentApi.getTournamentGames(tournamentId);
		return tournamentGames;
	} catch(error) {
		return null;
	}
}

// ======== GET CURRENT TOURNAMENT ============
async function getCurrentTournament(): Promise<Partial< TournamentData | null>> {
	try {
		const currentTournament = await tournamentApi.getCurrentTournament();
		return currentTournament;
	} catch(error) {
		return null;
	}
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext, tournamentGames: TournamentGame[] | null, tournament: Partial<TournamentData | null>) {

	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const tournamentGameComponent = document.getElementById('tournament-game-component') as any
	if (tournamentGameComponent) {
		tournamentGameComponent.ctx = ctx;
		tournamentGameComponent.tournamentGamesData = tournamentGames;
		tournamentGameComponent.tournamentData = tournament;
	} else {
		console.error('❌ Tournament games component not found!');
	}

	const tournamentNextGameComponent = document.getElementById('tournament-next-game-component') as any
	if (tournamentNextGameComponent) {
		tournamentNextGameComponent.ctx = ctx;
		tournamentNextGameComponent.tournamentGamesData = tournamentGames;
		tournamentNextGameComponent.tournamentData = tournament;
	} else {
		console.error('❌ Tournament games component not found!');
	}
}

// ======== UPDATE PLAYER INFO ============
function updatePlayerInfo(tournamentGames: TournamentGame[]) {

	const tournamentNextGameComponent = document.getElementById('tournament-next-game-component') as TournamentNextGame | null;
	if (tournamentNextGameComponent && tournamentGames) {
        tournamentNextGameComponent.tournamentGamesData = tournamentGames;
	}
}

// ======== SET WEBSOCKET CONNECTION ============
async function setGameRoomWebSockets(currentUser: UserState, tournamentGames: TournamentGame[], ctx: AppContext) {

	const gameIndex = tournamentGames.findIndex(game =>
		game.gameUsers.some(gameUser => gameUser.user.id === currentUser.id && game.status === 'PENDING')
	)

	if (gameIndex === -1) return;
	
	const gameData = tournamentGames[gameIndex];

	// Create Tournament Websocket
	tournamentWsConnection = new TournamentWsConnection();
	tournamentWsConnection.connect(gameData.tournamentId!, currentUser.id!,
		async (tournamentData) => {
			if (tournamentData.message) {
				const game = tournamentData.data;
   				const winner = game.gameUsers.find((gu: typeof game.gameUsers[0]) => gu.score === game.winnerScore);
    			// showToast(`${winner.user.username} won the match!`);
			}
		},
		() => {
			cleantTournamentWs()
			router.navigateTo('/home');
		},
		() => {
			cleantTournamentWs()
			router.navigateTo('/home');
		},
	)

	// Create websocket with gameid
	wsConnection = new WaitingRoomConnection();
	wsConnection.connect(gameData.id!, currentUser.id!,
		async (updateGameData) => {
			if (updateGameData.message) {
				tournamentGames[gameIndex] = updateGameData.game;
				updatePlayerInfo([...tournamentGames]);
			}
			console.log('websocket called')
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
			router.navigateTo(`/game/${gameData.id}`)
		}
	)
}

// ======== CLEANUP WEBSOCKET CONNECTION ============
export function cleanWaitingRoomWS() {
	if (wsConnection) {
		wsConnection.disconnect();
		wsConnection = null;
	}
}

export function cleantTournamentWs() {
	if (tournamentWsConnection) {
		tournamentWsConnection.disconnect();
		tournamentWsConnection = null;
	}
}


// ======== EVENT LISTENER ============
function setupTournamentEventListeners(ctx: AppContext) {
	// Start tournament game
	const tournamentGameComponent = document.getElementById('tournament-next-game-component') as any;
	tournamentGameComponent?.addEventListener('event-start-tournament-game', async (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const {id:gameId} = customEvent.detail.game;
		try {
			const response = await tournamentApi.startGame(gameId);
			console.log('start', response);
		} catch (error) {
			console.log(error);
		}
	})
}
