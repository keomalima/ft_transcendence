import './style.css';

import { LearnMore } from './pages/learnMore';
import { Profile } from './pages/profile';
import { EditProfile } from './pages/editProfile';
import { home } from './pages/home';
import { NotFound } from './pages/404';
import { register } from './pages/register';

const routes: Record<string, () => void> = {
	'/': home,
	'/register': register,
	'/LearnMore': LearnMore,
	'/profile': Profile,
	'/edit-profile': EditProfile
};

function router() {
	const path = window.location.pathname;
	const renderFunction = routes[path] || NotFound ;
	renderFunction();
}

export function navigateTo(path: string)
{
	window.history.pushState(null, '', path);
	router();
}

document.addEventListener('click', (e) => {
	const target = e.target as HTMLElement;

	if (target.matches('[data-link]')) {
		e.preventDefault();

		const href = target.getAttribute('href');

		history.pushState(null, '', href);

		router();
	}
})

window.addEventListener('popstate', router);


router();

