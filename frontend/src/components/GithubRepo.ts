import { fetchGitHubRepos } from "../utils/api";
import { githubRepo } from "../types";

async function loadAndRenderGithub(username: string, container: HTMLElement) {
	container.innerHTML = 'Loading ...';

	try {
		const repos = await fetchGitHubRepos(username);
		if (repos.length === 0) {
			container.textContent = "No public repo found.";
			return;
		}

		container.innerHTML = '';

		const list = document.createElement('div');
		list.className = 'grid gap-4 sm:grid-cols-2';

		repos.forEach(repo => {
			list.appendChild(createRepoCard(repo));
		})

		container.appendChild(list);

	}
	catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		container.textContent = `Error : ${message}`;
	}
}

function createRepoCard(repo: githubRepo): HTMLElement {
	const card = document.createElement('a');
	card.href = repo.html_url;
	card.target = '_blank';
	card.rel = 'noopener noreferrer';
	card.className = 'bg-white rounded-lg shadow-md block p-4 hover:shadow-xl hover:bg-stone-300 transition ';

	const title = document.createElement('h3');
	title.className = 'font-semibold';
	title.textContent = repo.name;

	const desc = document.createElement('p');
	desc.textContent = repo.description ?? '';
	desc.className = 'text-sm text-gray-600 mt-2';

	const meta = document.createElement('div');
	meta.className = 'text-xs text-gray-500 mt-3 flex gap-3 items-center';

	const lang = document.createElement('span');
	lang.textContent = repo.language ?? '—';
	lang.className = 'px-2 py-0.5 bg-gray-100 rounded';

	const stars = document.createElement('span');
	stars.textContent = `★ ${repo.stargazers_count}`;

	meta.appendChild(lang);
	meta.appendChild(stars);

	card.appendChild(title);
	card.appendChild(desc);
	card.appendChild(meta);

	return card;
}

// export default loadAndRenderGithub;

export function showGithub(username: string): HTMLElement {
	const githubSection = document.createElement('section');
	githubSection.className = 'm-8';

	const title = document.createElement('h2');
	title.className = 'text-2xl font-bold mb-4';
	title.textContent = 'GitHub Repositories';

	const cards = document.createElement('div');
	cards.className = 'grid gap-4 sm:grid-cols-2';
	cards.id = 'github-repos';

	githubSection.appendChild(title);
	githubSection.appendChild(cards);

	loadAndRenderGithub(username, cards).catch(err => {
		console.error('Failed to load GitHub repos:', err);
	});

	return githubSection;
}
export default showGithub;