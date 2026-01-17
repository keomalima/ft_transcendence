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
	isOnline: boolean;
	createdAt: string | null;
	updatedAt: string | null;
	avatarFile: File | null;
	avatarUrl: string | null;
}

export type GameState = Pick<GameData,
		| 'id' | 'token'
		| 'scoreToWin'
		| 'createdAt'
		| 'updatedAt'
		| 'tournamentId'
		| 'status' | 'type'
		| 'startedAt'
		| 'completedAt'
		| 'createdBy'
		| 'gameUsers'
	> & {
	roundNumber: number | null;
	matchNumber: number | null;
};

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
	isBlocked: boolean;
	isBlockedBy: boolean;
}

// for game data
export interface GameData {
	id: string | null;
	createdBy: string | null;
	tournamentId: string | null;
	isCreator: boolean;
	type: string | null;
	token: string | null;
	status: string | null;
	scoreToWin: number | null;
	createdAt: string | null;
	updatedAt: string | null;
	completedAt: string | null;
	startedAt: string | null;
	gameUsers: GameUsers[] | null;
}

// for gameUsers
export interface GameUsers {
	id: string | null;
	user: Pick<UserState, 'id' | 'displayName' | 'avatarUrl'> | null;
	score: string | null;
	isWinner: boolean;
	isReady: boolean;
}

// for gameToken
export interface GameToken {
	id: string | null;
	createdAt: string | null;
	type: string | null;
	token: string | null;
}

//for tournamentGames
export interface TournamentGame {
  id: string;
  tournamentId: string;
  status: string | null;
  type: string | null;
  roundNumber: number;
  matchNumber: number;
  gameUsers: Array<{
    id: string;
    score: number;
    isWinner: boolean;
    joinedAt: Date;
	isReady: boolean;
    user: {
      id: string;
      displayName: string;
      isOnline: boolean;
      avatarUrl: string;
    };
  }>;
}


import { UserStore } from "./store/userStore";
import { GameStore } from "./store/gameStore"
// Define context type
export interface AppContext {
	userStore: UserStore;
	gameStore: GameStore;
}

interface Opponent {
	id: string | null;

}

export interface GameHistory {
	gameId: string | null;
	score: number | null;
	isWinner: boolean | null;
	duration: number | null;
	type: string | null;
	status: string | null;
	date: string | null;
	opponent: {
		id: string | null;
		avatarUrl: string | null;
		name: string | null;
		score: number | null;
		isWinner: boolean | null;
	} | null;
}

export type CurrentTournamentInfo = {
  userId: string;
  tournamentId: string;
  type: string;
  token: string | null;
  totalRounds: number;
  currentRound: number;
  winner: {
	id: string,
	displayName: string,
	avatarUrl: string
  } | null
}

export interface TournamentParticipant {
    id: string;
    userId: string;
    user: Pick<UserState, 'id' | 'displayName' | 'avatarUrl'>;
    joinedAt: string;
    finalPosition: number | null;
    isEliminated: boolean;
    eliminatedInRound: number | null;
	isQuit: boolean
}

// for tournament data
export interface TournamentData {
	id: string;
    token: string | null;
    createdBy: string | null;
	isCreator: boolean;
    numberPlayers: number;
    status: 'REGISTRATION' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    currentRound: number;
    totalRounds: number;
    winnerId: string | null;
    winner?: Pick<UserState, 'id' | 'displayName' | 'avatarUrl'> | null;
    scoreToWin: number;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    participants: TournamentParticipant[];
    games: GameData[];
}

export type GameStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export type ChatMessage = {
	id: string;
	senderId: string;
	receiverId: string;
	content: string | null;
	sentAt: string;
	messageType: "TEXT";
} | {
	id: string;
	senderId: string;
	receiverId: string;
	content: string | null;
	sentAt: string;
	messageType: "GAME_INVITE";
	gameId?: string;
	gameStatus?: GameStatus;
};


export interface ChatTextMessagePayload {
	type: "chat-message";
	fromUserId: string;
	content: string;
	sentAt: string;
	messageType: "TEXT";
}

export interface ChatInviteMessagePayload {
	type: "chat-message";
	fromUserId: string;
	content: string;
	sentAt: string;
	messageType: "GAME_INVITE";
	gameId: string;
}

export interface ConnectedPayload {
	type: "connected";
	message: string;
}

export type ChatWsMessage =
	| ChatTextMessagePayload
	| ChatInviteMessagePayload
	| ConnectedPayload;

export type ChatErrorCode = "BLOCKED" | "SELF" | "NOT_FRIEND" | "U_IN_GAME" | "F_IN_GAME" |"UNKNOWN";

export interface SendMessageSuccess {
	status: "ok";
	messageId: string;
	sentAt: string;
	gameId?: string;
}

export interface SendMessageError {
	status: "error";
	reason: string;
	code: ChatErrorCode;
}

export type SendMessageResponse = SendMessageSuccess | SendMessageError;

export type FriendPaginationState = {
	oldestMessageId: string | null;
	hasMoreMessages: boolean;
};

export type FriendPaginationMap = Record<string, FriendPaginationState>;

export type JoinGameFromChatInput = {
	gameId: string;
};

export type JoinGameFromChatErrorCode = "U_IN_GAME" | "GAME_NOT_FOUND" | "NOT_INVITED" | "UNKNOWN";

export type JoinGameFromChatResponse =
	| { status: "ok" }
	| { status: "error"; reason: string; code: JoinGameFromChatErrorCode };

export type GetPendingInviteResponse =
  | { status: "ok"; gameId: string | null }
  | { status: "error"; reason: string; code: "SELF" | "NOT_FRIEND" | "UNKNOWN" };


