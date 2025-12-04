import type { AppContext, TournamentData, UserState } from "../types.js";
import { router } from "../main.js";
import { tournamentApi } from "../api/tournamentApi.js";
import type { PlayerList } from "../components/PlayersList.js";

export function TournamentRoom(ctx: AppContext, params?: Record<string, string>): string{
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
		let tournamentData = await getTournamentData(currentUser?.accessToken!, params['id']);
		if (!tournamentData)
			return;
		renderTournamentRoomContent(tournamentData);
		passContext(ctx, tournamentData, tournamentData.isCreator);
	}, 0)

	return `<div id="game-room-content">Loading tournament data...</div>`;
}


// ======== GET TOURNAMENT DATA ============
async function getTournamentData(token: string, id: string): Promise<TournamentData | null> {

	try {
		const tournamentData: TournamentData | null = await tournamentApi.getTournament(token, id);
		return tournamentData;
	} catch(error) {
		console.log(error);
		return null;
	}
}

// ======== UPDATE CONTENT ============
function renderTournamentRoomContent(tournamentData: TournamentData) {
	const content = document.getElementById('tournament -room-content');
	if (tournamentData.isCreator) {
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
function passContext(ctx: AppContext, tournamentData: TournamentData | null, isCreator: boolean | null) {

	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const playerListComponent = document.getElementById('player-list-component') as any;
	if (playerListComponent) {
		playerListComponent.ctx = ctx;
		playerListComponent.isCreator = isCreator;
		// playerListComponent.gameData = gameData;
	}
}