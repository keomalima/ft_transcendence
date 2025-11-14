import './style.css';

import { LearnMore } from './pages/LearnMore';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { Home } from './pages/Home';
import { NotFound } from './pages/404';
import { test } from './components/test';
import { Game } from './pages/Game';
import { Dashboard } from './pages/Dashboard';
import './htmlComponents/MyButton';
import './htmlComponents/MyLink';
import './htmlComponents/MyLabel'
import './htmlComponents/MyInput'

import { userStore } from './store/UserStorage';

// localStorage.clear();

userStore.loadFromLocalStorage();

if (userStore.getUserAccessToken() == null)
{
	localStorage.clear();
}

// Define map between path and render function
const routes: Record<string, () => void> = {
	'/': Home,
	'/LearnMore': LearnMore,
	'/profile': Profile,
	'/test': test,
	'/game': Game,
	'/edit-profile': EditProfile,
	'/dashboard': Dashboard
};

// Select the right path and execute the linked function
function router() {
	const path = window.location.pathname;
	userStore.loadFromLocalStorage();
	const renderFunction = routes[path] || NotFound;
	renderFunction();
}

// Route to the correct new path and add the path to history
export function navigateTo(path: string)
{
	window.history.pushState(null, '', path);
	router();
}

// Event delegation : gets every clicks.
// If click on a data-link <a> handle the navigation respecting the SPA requirement
document.addEventListener('click', (e) => {
	const target = e.target as HTMLElement;

	if (target.matches('[data-link]')) {
		e.preventDefault();

		const href = target.getAttribute('href');
		if (href)
			navigateTo(href);
	}
})

// Handle back and forward in browser history
window.addEventListener('popstate', router);

// Hender the first page (home)
router();

