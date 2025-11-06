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

export interface CreateUserDto {
	email: string;
	name: string;
	surname: string;
	password: string;
	displayName: string;
	city: string | null;
	avatarUrl: string | null;
}

export interface User {
	id: string;
	name: string;
	email: string;
}

export interface LogedUser {
	accessToken: string;
	email: string;
	name: string;
	isOnline: boolean;
}

export interface matchInfo {
	id: number;
	opponentName: string;
	scoreUser: number;
	scoreOpponent: number;
	winner: boolean;
	duration: number;
	date: string;
	mode: string;
}
