import { UserState } from "../types";
import httpCall from "./httpClient.js";
import { buildApiError } from "./apiError.js";

const BASE_URL = '/users';

// sending data to create a new user
export interface CreateUserDto {
	email: string | null;
	name: string | null;
	surname: string | null;
	displayName: string | null;
	avatarFile: File | null;
	password: string | null;
}

// response when creating a new user
export type CreateUserResp = Pick<UserState, 'id' | 'name' | 'email'>

// response when login
export type LoginUserResp = Pick<UserState, 'id'>

// response when get user
export type getUserResp = Omit<UserState, 'isLoggedIn' | 'createdAt' | 'updatedAt'>

// response update user
export type updateUserResp = Pick<UserState, 'name' | 'surname' | 'displayName' | 'avatarFile'>

// response update Avatar
export type updateAvatarResp = Pick<UserState, 'id' | 'email' | 'name' | 'surname' | 'displayName' | 'avatarUrl' | 'isOnline' | 'createdAt' | 'updatedAt'>

// reponse change password 
export type changePasswordResp = Pick< UserState, 'id' | 'updatedAt' >
 
export const userApi = {

	login: async (email:string, password:string): Promise<LoginUserResp | null> => {

		try {
			const response = await httpCall.post<LoginUserResp> (`${BASE_URL}/login`, {email, password });
			// console.log('⭐ loginUser success! ✅', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('login', error);
		}
	},

	me: async (): Promise<getUserResp | null> => {
		try {
			const response = await httpCall.get<getUserResp | null>(`${BASE_URL}/me`);
			// console.log('⭐ user validated! ✅', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('validation', error);
		}
	},

	get: async (userId: string):Promise<getUserResp | null> => {
		try {
			const response = await httpCall.get<getUserResp> (`${BASE_URL}/${userId}`);
			// console.log('⭐ getUser success ✅', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('get user info', error);
		}
	},

	logout: async (): Promise<void> => {
		try {
			await httpCall.post (`${BASE_URL}/logout`);
			// console.log('⭐ logoutUser success ✅ (no response body)');
		} catch (error: unknown) {
			throw buildApiError('logout', error);
		}
	},
	
	create: async (data: CreateUserDto): Promise<CreateUserResp | null> => {
		const formData = new FormData();
		formData.append('email', data.email || '');
		formData.append('name', data.name || '');
		formData.append('surname', data.surname || '');
		formData.append('displayName', data.displayName || '');
		formData.append('password', data.password || '');
		if (data.avatarFile) {
			formData.append('avatarFile', data.avatarFile);
		}
		try {
			const response = await httpCall.post<CreateUserResp> (`${BASE_URL}`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			// console.log('⭐ createUser success ✅', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('create a user', error);
		}
	},

	delete: async (): Promise<void> => {
		try {
			await httpCall.delete (`${BASE_URL}`);
			// console.log('⭐ deleteUser success ✅, (no response body)');
		} catch (error: unknown) {
			throw buildApiError('delete user', error);
		};
	},

	update: async (data: Partial<UserState>): Promise<updateUserResp> => {
		try {
			const cleanData = Object.fromEntries(
				Object.entries(data).filter(([_, value]) =>
					value !== null &&
					value !== undefined &&
					value !== ''
				)
			);
			if (Object.keys(cleanData).length === 0) {
				throw new Error('No fields to update');
			}
			const response = await httpCall.put<updateUserResp> (`${BASE_URL}/me`, cleanData);
			// console.log('⭐ updateUser success ✅', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('update user', error);
		}
	},

	changePassword: async (currentPassword: string, newPassword: string): Promise<changePasswordResp> => {
		try {
			const body = { currentPassword, newPassword };
			const response = await httpCall.put<changePasswordResp> (`${BASE_URL}/password`, body);
			// console.log('⭐ changeUserPassword success ✅', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('change user password user', error);
		}
	},

	updateAvatar: async (file: File): Promise<updateAvatarResp | null> => {
		const formData = new FormData();
		if (file) {
			formData.append('avatarFile', file);
		}
		try {
			const response = await httpCall.post<updateAvatarResp> (`${BASE_URL}/upload`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			// console.log('⭐ updateAvatar success ✅', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('update avatar', error);
		}
	}
}
