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
		if (!result || !result.accessToken || !result.id) {
			throw new Error('Login failed: Invalid response from server');
		}

		// store user data in UserStore
		ctx.userStore.update((prevState) => ({
			...prevState,
			accessToken: result.accessToken,
			id: result.id,
			isLoggedIn: true
		}));
		
		if (result?.id)
			localStorage.setItem('userId', result.id);
		if (result?.accessToken)
			localStorage.setItem('accessToken', result.accessToken);
		return result;
	}

	// logout
	async logoutUser(ctx: AppContext): Promise<void>
	{
		const user = ctx.userStore.get();
		const accessToken = user?.accessToken;
		if (!accessToken)
			throw new Error ('No active session for logout');
		await userApi.logout(accessToken);
		ctx.userStore.set(null);
		localStorage.removeItem('userId');
		localStorage.removeItem('accessToken');
	}

	// get user
	async getUserState(ctx: AppContext, id: string | null): Promise<getUserResp | null> {
		if (!id)
			throw new Error('Missing id to get user');
		const currentUser = ctx.userStore.get();
		const accessToken = currentUser?.accessToken;
		if (!accessToken)
			throw new Error('No active session for get user');

		const result = await userApi.get(id, accessToken);
		
		// Update store only if the get concerns the current user
		if (result && id === currentUser.id) {
			ctx.userStore.update((prevState) => ({
				...prevState,
				id: result.id ?? id,
				email: result.email ?? null,
				name: result.name ?? null,
				surname: result.surname ?? null,
				displayName: result.displayName ?? null,
				avatarUrl: result.avatarUrl ?? null,
				isOnline: result.isOnline ?? false,
				isLoggedIn: true,
			}));
		}
		return result;
	}

	// delete user
	async deleteUser(ctx: AppContext): Promise<void> {
		const currentUser = ctx.userStore.get();
		const accessToken = currentUser?.accessToken;
		if (!accessToken)
			throw new Error('No active session for delete user');

		await userApi.delete(accessToken);
		ctx.userStore.set(null);
		localStorage.removeItem('userId');
		localStorage.removeItem('accessToken');
	}

	// update user
	async updateUser(data: Partial<UserState>, ctx: AppContext): Promise<updateUserResp> {
		const currentUser = ctx.userStore.get();
		const accessToken = currentUser?.accessToken;
		if (!accessToken)
			throw new Error('No active session for update user');

		const result = await userApi.update(accessToken, data);
		
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
		const currentUser = ctx.userStore.get();
		const accessToken = currentUser?.accessToken;
		if (!accessToken)
			throw new Error('No active session for update avatar');

		const result = await userApi.updateAvatar(accessToken, file);

		// Update avatar URL in store
		ctx.userStore.update((prevState) => ({
			...prevState,
			avatarUrl: result?.avatarUrl ?? prevState.avatarUrl
		}));
		
		return result;
	}

	// clean user store
	private cleanUser(ctx: AppContext): void {
		ctx.userStore.set({
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



}

export const userService = new UserService();
