import { UserState } from "../types";

class UserStore {
	private state: UserState = {
		id: null,
		email: null,
		name: null,
		surname: null,
		displayName: null,
		isLoggedIn: false,
		accessToken: null,
		isOnline: false,
		createdAt: null,
		updatedAt: null,
		avatarUrl: null,
		city: null
	}

	// setters
	setUserId(id: string): void {
		this.state.id = id;
	}

	setUserMail(email: string): void  {
		this.state.email = email;
	}

	setUserName(name: string): void  {
		this.state.name = name;
	}

	setSurname(name: string): void  {
		this.state.surname = name;
	}

	setUserDisplayname(name: string): void  {
		this.state.displayName = name;
	}

	setUserAvatar(avatarUrl: string): void  {
		this.state.avatarUrl = avatarUrl;
	}

	setUserCity(city: string): void  {
		this.state.city = city;
	}

	setUserAccessToken(accessToken: string): void  {
		this.state.accessToken = accessToken;
	}

	setUserLogStatus(logStatus: boolean): void  {
		this.state.isLoggedIn = logStatus;
	}

	setUserOnlineStatus(OnlineStatus: boolean): void  {
		this.state.isOnline = OnlineStatus;
	}

	setUserInfo(user: Partial<UserState>): void {
		if (user.id)
			this.state.id = user.id;
		if (user.email)
			this.state.email = user.email;
		if (user.name)
			this.state.name = user.name;
		if (user.surname)
			this.state.surname = user.surname;
		if (user.displayName)
			this.state.displayName = user.displayName;
		if (user.isLoggedIn)
			this.state.isLoggedIn = user.isLoggedIn;
		if(user.accessToken)
			this.state.accessToken = user.accessToken;
		if (user.isOnline)
			this.state.isOnline = user.isOnline;
		if (user.createdAt)
			this.state.createdAt = user.createdAt;
		if (user.updatedAt)
			this.state.updatedAt = user.updatedAt;
		if (user.city)
			this.state.city = user.city;
	}

	// getters
	getUserId(): string | null {
		return this.state.id;
	}

	getUserAccessToken(): string | null {
		return this.state.accessToken;
	}

	getUserName(): string | null {
		return this.state.name;
	}

	getUserSurname(): string | null {
		return this.state.surname;
	}

	getUserUsername(): string | null {
		return this.state.displayName;
	}

	getUserUserMail(): string | null {
		return this.state.email;
	}

	getUserUserCity(): string | null {
		return this.state.city;
	}

	getUserInfo(): UserState {
		return this.state;
	}

	// clear all
	clearUserState(): void {
		console.log('===== cleaning of local storage =====')
		this.state.id = null;
		this.state.email = null;
		this.state.name = null;
		this.state.surname = null;
		this.state.displayName = null;
		this.state.isLoggedIn = false;
		this.state.accessToken = null;
		this.state.isOnline = false;
	}

	// save in local storage
	saveToLocalStorage(): void {
        localStorage.setItem('userState', JSON.stringify(this.state));
	}

	// load from local storage
	loadFromLocalStorage(): void {
		const saved: string | null = localStorage.getItem('userState');
		if (saved) {
			this.state = JSON.parse(saved);
		}
	}

}

// Export singleton instance
export const userStore = new UserStore();
