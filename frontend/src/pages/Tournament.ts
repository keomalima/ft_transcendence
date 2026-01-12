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
import { TournamentBracket } from "../components/TournamentBracket.js";

let wsConnection: WaitingRoomConnection | null = null;
let tournamentWsConnection: TournamentWsConnection | null = null;

export function Tournament(ctx: AppContext, params?: Record<string, string>): string {
	//get user data from store
	const currentUser: UserState | null = ctx.userStore.get();
	
	// secure if no params
	if (!params || !params['id'])
	{
		setTimeout(() => router.navigateTo('/home'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	setTimeout(async () => {
		const currentTournament = await getCurrentTournament(params['id']);
		console.log(currentTournament);
		const tournamentGames = await getTournamentGames(params['id']);
		if (currentTournament?.status === 'REGISTRATION') {
			setTimeout(() => router.navigateTo(`/tournament-room/${params['id']}`), 0);
		}
		const participant = await getParticipantInfo(params['id']);
		if (!participant || participant.isQuit) {
			setTimeout(() => router.navigateTo(`/tournament`), 0);
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
	return content;
}

// ======== GET CURRENT PARTICIPANT INFO ============
async function getParticipantInfo(tournamentId: string): Promise<{isQuit: boolean, isEliminated: boolean} | null> {
	try {
		const participantInfo = await tournamentApi.getParticipantInfo(tournamentId);
		if (!participantInfo) return null;
		return {
			isQuit: participantInfo.isQuit ?? false,
			isEliminated: participantInfo.isEliminated ?? false
		};
	} catch(error) {
		console.log(error);
		return null;
	}
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
async function getCurrentTournament(tournamentId: string): Promise<Partial< TournamentData | null>> {
	try {
		const currentTournament = await tournamentApi.getTournament(tournamentId);
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
	const tournamentBracketComponent = document.getElementById('tournament-game-component') as TournamentBracket | null;
	if (tournamentNextGameComponent && tournamentBracketComponent && tournamentGames) {
        tournamentNextGameComponent.tournamentGamesData = tournamentGames;
		tournamentBracketComponent.tournamentGamesData = tournamentGames;
	}
}

// ======== SET WEBSOCKET CONNECTION ============
async function setGameRoomWebSockets(currentUser: UserState, tournamentGames: TournamentGame[], ctx: AppContext) {
	// Create Tournament Websocket
	tournamentWsConnection = new TournamentWsConnection();
	tournamentWsConnection.connect(tournamentGames[0].tournamentId, currentUser.id!,
		async (tournamentData) => {
			if (tournamentData.gameId) {
				const game = tournamentData.game;
				const nextGame = tournamentData.nextGame
				const tournamentBracketComponent = document.getElementById('tournament-game-component') as TournamentBracket | null;
				tournamentBracketComponent?.updateGameCard(game, nextGame);
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

	const gameIndex = tournamentGames.findIndex(game =>
		game.gameUsers.some(gameUser => gameUser.user.id === currentUser.id && game.status === 'PENDING')
	)

	if (gameIndex === -1) return;
	
	const gameData = tournamentGames[gameIndex];

	// Create websocket with gameid
	wsConnection = new WaitingRoomConnection();
	wsConnection.connect(gameData.id!, currentUser.id!,
		async (updateGameData) => {
			if (updateGameData.message) {
				tournamentGames[gameIndex] = updateGameData.game;
				updatePlayerInfo(tournamentGames);
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
	
	tournamentGameComponent?.addEventListener('event-quit-tournament', async (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const {tournamentId} = customEvent.detail;
		try {
			await tournamentApi.quitActiveTournament(tournamentId);
			router.navigateTo(`/`)
		} catch (error) {
			console.log(error);
		}
	})

}
