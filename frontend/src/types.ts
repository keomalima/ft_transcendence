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
	avatarFile: File | null;
	avatarUrl: string | null;
}

// for frienship data
export interface FriendshipData {
	id: string | null;
	requesterId: string | null;
	requester: UserState | null;
	adresseeId: string | null;
	adressee: UserState | null;
	status: string | null;
	createdAt: string | null;
	updatedAt: string | null;
	deletedAt: string | null;
}

// for request data
export interface RequestData {
	id: string | null;
	createdAt: string | null;
	friend: FriendData | null;
}


// for friend data
export interface FriendData {
	id: string | null;
	friendshipId: string | null;
	displayName: string | null;
	name: string | null;
	surname: string | null;
	isOnline: boolean;
	avatarUrl: string | null;
}
