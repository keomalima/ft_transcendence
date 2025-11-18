import "./components/hello-card.js";
import { Router } from "./router.js";

// Import pages
import { Home } from "./pages/home.js";
import { About } from "./pages/about.js";
import { createStores } from "./store/store.js";
import { NotFound } from "./pages/404.js";
import { Dashboard } from "./pages/Dashboard.js";
import { Profile } from "./pages/Profile.js";
import { EditProfile } from "./pages/EditProfile.js";

const INPUT_CLASSES = 'block w-full rounded-full bg-blue-500 px-3 py-1.5 text-base text-gray-900 \
	utline outline-1 outline-muted placeholder:text-gray-400 \
	focus:outline-2 focus:outline-muted';


// Create stores
const stores = createStores();

// Load saved user state from localStorage if it exists
const savedUserState = localStorage.getItem('userState');
if (savedUserState && savedUserState.trim() !== '' && savedUserState !== 'null') {
	try {
		stores.user.set(JSON.parse(savedUserState));
	} catch (error) {
		console.error('Failed to load user state from localStorage:', error);
		localStorage.removeItem('userState'); // Clean up invalid data
		// If parsing fails, set default null state
		stores.user.set({
			id: null,
			email: null,
			name: null,
			surname: null,
			displayName: null,
			isLoggedIn: false,
			accessToken: null,
			isOnline: false,
			createdAt: null,
			updatedAt: null,
			avatarFile: null,
			avatarUrl: null
		});
	}
} else {
	// No saved state, initialize with defaults
	stores.user.set({
		id: null,
		email: null,
		name: null,
		surname: null,
		displayName: null,
		isLoggedIn: false,
		accessToken: null,
		isOnline: false,
		createdAt: null,
		updatedAt: null,
		avatarFile: null,
		avatarUrl: null
	});
}

// launch router with context (stores)
export const router = new Router("#root", stores); // only one instance of router for the whole project
router
    .add("/", Home)
    .add("/about", About)
    .add("/404", NotFound)
    .add("/home", Dashboard)
    .add("/profile", Profile)
    .add("/edit-profile", EditProfile)
    .start();
