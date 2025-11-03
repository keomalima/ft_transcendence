import './style.css';

import { learnMore } from './pages/learnMore';
import { Profile } from './pages/Profile';
import { home } from './pages/home';
import { notFound } from './pages/404';

const routes: Record<string, () => void> = {
	'/': home,
	'/learnmore': learnMore,
	'/profile': Profile
};

function router() {
	const path = window.location.pathname;
	const renderFunction = routes[path] || notFound ;
	renderFunction();
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

