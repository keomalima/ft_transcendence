import "./components/hello-card.js";
import { Router } from "./router.js";
import { Home } from "./pages/home.js";
import { About } from "./pages/about.js";
import { createStores } from "./store/store.js";

const INPUT_CLASSES = 'block w-full rounded-full bg-blue-500 px-3 py-1.5 text-base text-gray-900 \
	utline outline-1 outline-muted placeholder:text-gray-400 \
	focus:outline-2 focus:outline-muted';


// Create stores
const stores = createStores();

// First init of stores
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

// launch router with context (stores)
export const router = new Router("#app", stores); // only one instance of router for the whole project
router
    .add("/", Home)
    .add("/about", About)
    .start();
