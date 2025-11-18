import { AppStores } from "../store/store";
import { UserState } from "../types";
import { updateAvatarResp, userApi } from "../api/userApi.js";

import { CreateUserDto, CreateUserResp, LoginUserResp, getUserResp, updateUserResp } from "../api/userApi.js";

class UserService {

	// create user
	async createUser(data: CreateUserDto, ctx: AppStores): Promise<CreateUserResp | null>{
		
		const result = await userApi.create(data);

		ctx.user.update((prevState) => {
			if (!prevState) {
				return {
					accessToken: null,
					id: result?.id?? null,
					isLoggedIn: false,
					email: result?.email?? null,
					name: result?.name?? null,
					surname: null,
					displayName: null,
					isOnline: false,
					createdAt: null,
					updatedAt: null,
					avatarFile: null,
					avatarUrl: null
				};
			}
			return {
				...prevState,
				email: result?.email?? null,
				name: result?.name?? null,
				id: result?.id?? null,
			};
		});

		this.saveToLocalStorage(ctx);
		return result;
	}


	// login
	async loginUser(email: string, password: string, ctx: AppStores): Promise<LoginUserResp>
	{
		const result = await userApi.login(email, password);
		
		// Validate result
		if (!result || !result.accessToken || !result.id) {
			throw new Error('Login failed: Invalid response from server');
		}

		// store user data in UserStore
		ctx.user.update((prevState) => {
			if (!prevState) {
				return {
					accessToken: result.accessToken,
					id: result.id,
					isLoggedIn: true,
					email: null,
					name: null,
					surname: null,
					displayName: null,
					isOnline: true,
					createdAt: null,
					updatedAt: null,
					avatarFile: null,
					avatarUrl: null
				};
			}
			return {
				...prevState,
				accessToken: result.accessToken,
				id: result.id,
				isLoggedIn: true
			};
		});

		this.saveToLocalStorage(ctx);
		return result;
	}

	// logout
	async logoutUser(ctx: AppStores): Promise<void>
	{
		const user = ctx.user.get();
		const accessToken = user?.accessToken;
		if (!accessToken)
			throw new Error ('No active session for logout');
		await userApi.logout(accessToken);
		ctx.user.set(null);
		this.saveToLocalStorage(ctx);
	}

	// get user
	async getUserState(ctx: AppStores, id: string | null): Promise<getUserResp | null> {

		this.loadFromLocalStorage(ctx);
		if (!id)
			throw new Error('Missing id to get user');
		const currentUser = ctx.user.get();
		const accessToken = currentUser?.accessToken;
		if (!accessToken)
			throw new Error('No active session for get user');

		const result = await userApi.get(id, accessToken);
		
		// Update store only if the get concerns the current user
		if (result) {
			if (id === currentUser.id) {
				ctx.user.update((prevState) => ({
					...(prevState || {}),
					id: result.id ?? id,
					email: result.email ?? null,
					name: result.name ?? null,
					surname: result.surname ?? null,
					displayName: result.displayName ?? null,
					avatarUrl: result.avatarUrl ?? null,
					isOnline: result.isOnline ?? false,
					accessToken: prevState?.accessToken ?? accessToken,
					isLoggedIn: true,
					createdAt: prevState?.createdAt ?? null,
					updatedAt: prevState?.updatedAt ?? null,
					avatarFile: prevState?.avatarFile ?? null
				}));
			}
		}
		this.saveToLocalStorage(ctx);
		return result;
	}

	// delete user
	async deleteUser(ctx: AppStores): Promise<void> {
		const currentUser = ctx.user.get();
		const accessToken = currentUser?.accessToken;
		if (!accessToken)
			throw new Error('No active session for delete user');

		await userApi.delete(accessToken);
		ctx.user.set(null);
		this.saveToLocalStorage(ctx);
	}

	// update user
	async updateUser(data: Partial<UserState>, ctx: AppStores): Promise<updateUserResp> {
		this.loadFromLocalStorage(ctx);
		const currentUser = ctx.user.get();
		const accessToken = currentUser?.accessToken;
		if (!accessToken)
			throw new Error('No active session for update user');

		const result = await userApi.update(accessToken, data);
		
		// Update only the fields that were returned from the API
		ctx.user.update((prevState) => {
			if (!prevState) {
				throw new Error('Cannot update user: no current user state');
			}
			return {
				...prevState,
				name: result.name ?? prevState.name,
				surname: result.surname ?? prevState.surname,
				displayName: result.displayName ?? prevState.displayName,
				avatarFile: result.avatarFile ?? prevState.avatarFile
			};
		});
		this.saveToLocalStorage(ctx);
		return result;
	}

	// update Avatar
	async updateAvatar(file: File, ctx: AppStores): Promise<updateAvatarResp | null> {
		this.loadFromLocalStorage(ctx);
		const currentUser = ctx.user.get();
		const accessToken = currentUser?.accessToken;
		if (!accessToken)
			throw new Error('No active session for update avatar');

		const result = await userApi.updateAvatar(accessToken, file);

		// Update avatar URL in store
		ctx.user.update((prevState) => {
			if (!prevState) {
				throw new Error('Cannot update avatar: no current user state');
			}
			return {
				...prevState,
				avatarUrl: result?.avatarUrl ?? prevState.avatarUrl
			};
		});
		this.saveToLocalStorage(ctx);
		return result;
	}

	// clean user store
	private cleanUser(ctx: AppStores): void {
		ctx.user.set({
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
			avatarFile: null,
			avatarUrl: null
		});
	}

	// save, get and clean user from local storage
	private saveToLocalStorage(ctx: AppStores):void {
		console.log('SAVE to local storage');
		const userState = ctx.user.get();
		if (userState)
			localStorage.setItem('userState', JSON.stringify(userState));
	}

	private loadFromLocalStorage(ctx: AppStores): void {
		console.log('load from local storage');
		const saved: string | null = localStorage.getItem('userState');

		if (saved && saved.trim() !== '') {
			try {
				const parsed = JSON.parse(saved);
				ctx.user.set(parsed);
			} catch (error) {
				console.error('Failed to parse userState from localStorage');
				localStorage.removeItem('userState');
			}
		}
	}

}

export const userService = new UserService();
