export interface Project {
	id: number;
	title: string;
	description: string;
	technologies: string[];
	githubUrl?: string;
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

// for storing user local state
export interface UserState {
	id: string | null;
	email: string | null;
	name: string | null;
	surname: string | null;
	displayName: string | null;
	isLoggedIn: boolean;
	accessToken: string | null;
	isOnline: boolean;
	createdAt: string | null;
	updatedAt: string | null;
	avatarUrl: string | null;
	city: string | null;
}



