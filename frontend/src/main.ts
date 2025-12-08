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
import { LaunchGame } from "./pages/LaunchGame.js";
import { CreateTournament } from './pages/CreateTournament.js'
import { TournamentRoom } from "./pages/TournamentRoom.js";

// Create and init user store
const userStore = createUserStore(null);
userStore.init(null);


// Create context
const context: AppContext = {
	userStore
};

// Async initialization function
async function initializeApp() {
	// Load saved userId from localStorage
	const savedUserId = localStorage.getItem('userId');

	// If both exist, restore the session and fetch user data
	if (savedUserId) {
		context.userStore.update((prevState) => ({
			...prevState,
			id: savedUserId,
			// defer flipping isLoggedIn until getUserState confirms the session
		}));
		// Fetch full user data from API (wait for it to complete)
		try {
			await userService.getUserState(context, savedUserId);
		} catch (error) {
			console.error('Failed to restore session:', error);
			// Clear invalid session
			localStorage.removeItem('userId');
			context.userStore.set(null);
		}
	}

	// Start router after data is loaded
	router
		.add("/", Home)
		.add("/404", NotFound)
		.add("/home", Dashboard)
		.add("/profile", Profile)
		.add("/edit-profile", EditProfile)
		.add("/create-game", CreateGame)
		.add("/game-room/:id", GameRoom)
		.add("/launch-game", LaunchGame)
		.add("/create-tournament", CreateTournament)
		.add("/tournament-room/:id", TournamentRoom)
		.start();

	// Event listener to check localstorage change
	window.addEventListener('storage', async (e) => {
		if (e.key === 'userId') {
			if (!localStorage.getItem('userId')) {
				userService.cleanUser(context);
				router.navigateTo('/');
			} else {
				console.log('local storage event');
				const userId = localStorage.getItem('userId');

				context.userStore.update((prevState) => ({
					...prevState,
					id: userId
				}));
				await userService.getUserState(context, userId);
				router.navigateTo('/home');
			}
		}
	})
}

// launch router with context
export const router = new Router("#root", context);

// Initialize the app
initializeApp();
