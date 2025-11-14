import './style.css';

import { createHeader } from './components/Header';
import { createAbout } from './components/About';
import { createProjects } from './components/Projects';
import { showGithub } from './components/GithubRepo';
import { testBackend } from './pages/testBackend';
import { createHome } from './pages/Home';

// Get the root element
const root = document.getElementById('root');

if (root) {
	// Clear the root
	root.innerHTML = '';

	root.appendChild(createHome());

	// const nav = document.createElement('nav');
	// nav.className = 'flex gap-4 p-4 bg-stone-800 text-white';

	// const homeLink = document.createElement('button');
	// homeLink.className = 'hover:underline';
	// homeLink.textContent = 'Home';

	// const backendLink = document.createElement('button');
	// backendLink.className = 'hover:underline';
	// backendLink.textContent = 'Backend status';

	// const content = document.createElement('main');
	// content.className = 'min-h-screen bg-stone-100 text-stone-900';

	// function renderHome() {
	// 	content.innerHTML = '';
	// 	content.appendChild(createHeader());
	// 	content.appendChild(createAbout());
	// 	content.appendChild(createProjects());
	// 	content.appendChild(showGithub('lyshathan'));
	// }

	// function renderBackend() {
	// 	testBackend(content);
	// }

	// homeLink.addEventListener('click', renderHome);
	// backendLink.addEventListener('click', renderBackend);

	// nav.appendChild(homeLink);
	// nav.appendChild(backendLink);
	// root.appendChild(nav);
	// root.appendChild(content);

	// renderHome();

}
