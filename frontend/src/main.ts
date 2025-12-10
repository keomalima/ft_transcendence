import { Router } from "./router.js";
import { AppContext } from "./types.js";
import { userService } from "./services/UserService.js";

// Import pages
import { Home } from "./pages/Home.js";
import { createUserStore, UserStore } from "./store/userStore.js";
import { NotFound } from "./pages/404.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Profile } from "./pages/Profile.js";
import { EditProfile } from "./pages/EditProfile.js";
import { CreateGame } from "./pages/CreateGame.js";
import { GameRoom } from "./pages/GameRoom.js";
import { Game } from "./pages/Game.js";
import { CreateTournament } from './pages/CreateTournament.js'
import { TournamentRoom } from "./pages/TournamentRoom.js";
import { Tournament } from "./pages/Tournament.js";
import { createGameStore } from "./store/gameStore.js";

// Create and init user store
const userStore = createUserStore(null);
const gameStore = createGameStore(null);
userStore.init(null);
gameStore.init(null);

// Track whether we've already attempted to hydrate the session from the backend.
let hasHydratedSession = false;
let hydratingSession = false;

// Create context
const context: AppContext = {
	userStore,
	gameStore
};

// When session is invalidated elsewhere (401 interceptor), clear local state.
window.addEventListener('session:unauthorized', () => {
	hasHydratedSession = true; // we know there's no valid session
	userService.cleanUser(context);
});

// Async initialization function
async function initializeApp() {
	// The router guard will handle the initial session check,
	// so we can start the router immediately.
	router
		.add("/", Home)
		.add("/404", NotFound)
		.add("/home", Dashboard)
		.add("/profile", Profile)
		.add("/edit-profile", EditProfile)
		.add("/create-game", CreateGame)
		.add("/game-room/:id", GameRoom)
		.add("/game/:id", Game)
		.add("/create-tournament", CreateTournament)
		.add("/tournament-room/:id", TournamentRoom)
		.add("/tournament", Tournament)
		.start();

	// This listener handles multi-tab logout. When one tab logs out
	// (and clears the session state), others will follow.
	window.addEventListener('storage', async (e) => {
		if (e.key === 'session-cleared' && e.newValue !== null) {
			userService.cleanUser(context);
			router.navigateTo('/');
		}
	})
}

// launch router with context
export const router = new Router("#root", context);

// Define which routes do not require authentication.
const publicRoutes = new Set(['/', '/login', '/register', '/404']);

// Try to hydrate the session from the server once per page load.
const hydrateSessionOnce = async (ctx: AppContext): Promise<boolean> => {
	// Avoid duplicate calls triggered by multiple guard executions.
	if (hasHydratedSession || hydratingSession) {
		return ctx.userStore.get()?.isLoggedIn ?? false;
	}
	hydratingSession = true;
	try {
		await userService.getUserState(ctx);
		return true;
	} catch {
		return false;
	} finally {
		hasHydratedSession = true;
		hydratingSession = false;
	}
};

router.useGuard(async (path, ctx) => {
	const entryPage = path === '/' || path === '/login' || path === '/register';
	const isPublic = publicRoutes.has(path);
	const user = ctx.userStore.get();
	let isLoggedIn = user?.isLoggedIn ?? false;

	// If we don't yet know, attempt to hydrate the session once.
	if (!isLoggedIn) {
		isLoggedIn = await hydrateSessionOnce(ctx);
	}

	// When already logged in, avoid showing public entry pages and jump to profile.
	if (isPublic && isLoggedIn && entryPage) {
		router.navigateTo('/home');
		return false;
	}

	// Allow public pages; block protected routes if no session.
	if (isPublic) {
		return true;
	}
	return isLoggedIn;
});

// Initialize the app
initializeApp();
