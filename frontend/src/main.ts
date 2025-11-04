import './style.css';

import { learnMore } from './pages/learnMore';
import { Profile } from './pages/profile';
import { home } from './pages/home';
import { notFound } from './pages/404';
import { register } from './pages/register';

const routes: Record<string, () => void> = {
	'/': home,
	'/register': register,
	'/learnmore': learnMore,
	'/profile': Profile
};

function router() {
	const path = window.location.pathname;
	const renderFunction = routes[path] || notFound ;
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

