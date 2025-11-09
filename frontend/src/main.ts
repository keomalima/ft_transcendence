import './style.css';

import { LearnMore } from './pages/learnMore';
import { Profile } from './pages/profile';
import { EditProfile } from './pages/editProfile';
import { home } from './pages/home';
import { NotFound } from './pages/404';
import { test } from './components/test';
import { game } from './pages/game';
import './components/MyButton';
import './components/MyLink';
import './components/MyLabel'
import './components/MyInput'

import { userStore } from './store/UserStorage';

userStore.loadFromLocalStorage();

// let ctx
// Define map between path and render function
const routes: Record<string, () => void> = {
	'/': home,
	'/LearnMore': LearnMore,
	'/profile': Profile,
	'/test': test,
	'/game': game,
	'/edit-profile': EditProfile
};

// Select the right path and execute the linked function
function router() {
	const path = window.location.pathname;
	const renderFunction = routes[path] || NotFound ;
	// const ctx = user()
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

