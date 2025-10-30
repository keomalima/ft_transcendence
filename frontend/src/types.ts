export interface Project {
	id: number;
	title: string;
	description: string;
	technologies: string[];
	githubUrl?: string;
}

export interface personalInfo {
	name: string;
	title: string;
	bio: string;
	email: string;
	github: string;
	phone: string;
}

export interface githubRepo {
	id: number;
	name: string;
	full_name: string;
	html_url: string;
	description: string | null;
	language: string | null;
	stargazers_count: number;
	fork: boolean;
	updated_at: string;
}