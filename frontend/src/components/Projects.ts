import type { Project } from '../types';
import { projectsData } from '../data/projectsData';

export function createProjects() : HTMLElement {

	const section = document.createElement('section');
	section.className = 'p-8';

	const h2 = document.createElement('h2');
	h2.className = 'text-2xl font-bold mb-5';
	h2.textContent = 'My projects';



	const div = document.createElement('div');
	div.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
	projectsData.forEach((p) => {
		div.appendChild(createProjectCard(p));
	});

	section.appendChild(h2);
	section.appendChild(div);

	return section;
}

function createProjectCard(project : Project) : HTMLElement {

	const card = document.createElement('div');
	card.className = 'bg-white p-4 rounded-lg shadow-md';
	
	const title = document.createElement('h3');
	title.className = 'text-xl font-bold';
	title.textContent = project.title;

	const description = document.createElement('p');
	description.className = 'text-lg';
	description.textContent = project.description;

	card.appendChild(title);
	card.appendChild(description);

	return card;
}