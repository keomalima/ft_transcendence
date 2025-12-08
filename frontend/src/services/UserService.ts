import { AppContext } from "../types";
import { UserState } from "../types";
import { updateAvatarResp, userApi } from "../api/userApi.js";

import { CreateUserDto, CreateUserResp, LoginUserResp, getUserResp, updateUserResp } from "../api/userApi.js";

class UserService {

	// create user
	async createUser(data: CreateUserDto, ctx: AppContext): Promise<CreateUserResp | null>{
		
		const result = await userApi.create(data);

		ctx.userStore.update((prevState) => ({
			...prevState,
			email: result?.email ?? null,
			name: result?.name ?? null,
			id: result?.id ?? null,
		}));
		
		if (result?.id)
			localStorage.setItem('userId', result.id);
		return result;
	}


	// login
	async loginUser(email: string, password: string, ctx: AppContext): Promise<LoginUserResp>
	{
		const result = await userApi.login(email, password);
		
		// Validate result
		if (!result || !result.id) {
			throw new Error('Login failed: Invalid response from server');
		}

		// store user data in UserStore
		ctx.userStore.update((prevState) => ({
			...prevState,
			id: result.id,
			// wait for getUserState to set isLoggedIn after server confirmation
		}));
		
		if (result?.id)
			localStorage.setItem('userId', result.id);

		await this.getUserState(ctx);
		return result;
	}

	// logout
	async logoutUser(ctx: AppContext): Promise<void>
	{
		const user = ctx.userStore.get();
		await userApi.logout();
		this.cleanUser(ctx);
		// Broadcast logout to other tabs
		localStorage.setItem('session-cleared', Date.now().toString());
		localStorage.removeItem('userId');
	}

	// get user
	async getUserState(ctx: AppContext): Promise<getUserResp | null> {
		const result = await userApi.me();
		if (!result) {
			throw new Error('No active session');
		}

		// Update store with the validated session data
		ctx.userStore.update((prevState) => ({
			...prevState,
			id: result.id ?? prevState.id ?? null,
			email: result.email ?? null,
			name: result.name ?? null,
			surname: result.surname ?? null,
			displayName: result.displayName ?? null,
			avatarUrl: result.avatarUrl ?? null,
			isOnline: result.isOnline ?? false,
			isLoggedIn: true,
		}));
		return result;
	}

	// delete user
	async deleteUser(ctx: AppContext): Promise<void> {
		await userApi.delete();
		this.cleanUser(ctx);
		localStorage.removeItem('userId');
	}

	// update user
	async updateUser(data: Partial<UserState>, ctx: AppContext): Promise<updateUserResp> {
		const result = await userApi.update(data);
		
		// Update only the fields that were returned from the API
		ctx.userStore.update((prevState) => ({
			...prevState,
			name: result.name ?? prevState.name,
			surname: result.surname ?? prevState.surname,
			displayName: result.displayName ?? prevState.displayName,
			avatarFile: result.avatarFile ?? prevState.avatarFile
		}));
		
		return result;
	}

	// update Avatar
	async updateAvatar(file: File, ctx: AppContext): Promise<updateAvatarResp | null> {
		const result = await userApi.updateAvatar(file);

		// Update avatar URL in store
		ctx.userStore.update((prevState) => ({
			...prevState,
			avatarUrl: result?.avatarUrl ?? prevState.avatarUrl
		}));
		
		return result;
	}

	// clean user store
	cleanUser(ctx: AppContext): void {
		ctx.userStore.set({
			id: null,
			email: null,
			name: null,
			surname: null,
			displayName: null,
			isLoggedIn: false,
			isOnline: false,
			createdAt: null,
			updatedAt: null,
			avatarFile: null,
			avatarUrl: null
		});
	}



}

export const userService = new UserService();
