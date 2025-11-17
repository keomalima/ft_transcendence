import type { githubRepo } from '../types'

export async function fetchGitHubRepos(username: string): Promise<githubRepo[]> {
	if (!username || username.trim() === ''){
		throw new Error('fetchGitHubRepos: username is required');
	}

	const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;

	const res = await fetch(url);

	if (!res.ok) {
		if(res.status === 404) {
			throw new Error(`User "${username}" not found (404)`);
		}
		throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
	}

	const data = await res.json();

	if (!Array.isArray(data)) {
		throw new Error('Unexpected GitHub response format');
	}

	return data.map((r: any) => ({
		id: r.id,
		name: r.name ?? '',
		full_name: r.full_name ?? '',
		html_url: r.html_url ?? '',
		description: r.description ?? null,
		language: r.language ?? null,
		stargazers_count: r.stargazers_count ?? 0,
		fork: Boolean(r.fork),
		updated_at: r.updated_at ?? '',
	}))
}