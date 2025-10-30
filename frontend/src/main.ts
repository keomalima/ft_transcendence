import './style.css';

import { createHeader } from './components/Header';
import { createAbout } from './components/About';
import { createProjects } from './components/Projects';
import { showGithub } from './components/GithubRepo';
// import { loadAndRenderGithub } from './components/GithubRepo';

// Get the root element
const app = document.getElementById('app');

if (app) {
	// Clear the app
	app.innerHTML = '';
	
	// Create and append components
	app.appendChild(createHeader());
	app.appendChild(createAbout());
	app.appendChild(createProjects());
	app.appendChild(showGithub('lyshathan'));

}