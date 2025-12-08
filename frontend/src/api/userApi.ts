import { AxiosError } from "axios";
import { UserState } from "../types";
import httpCall from "./httpClient.js";

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
 
export const userApi = {

	login: async (email:string, password:string): Promise<LoginUserResp | null> => {

		try {
			const response = await httpCall.post (`${BASE_URL}/login`, {email, password });
			console.log('⭐ loginUser success! ✅', response.data);
			return response.data;
		} catch (error: any) {
			console.log('❌ Failed to login');
			const axiosErr = error as AxiosError<{ message?: string }>;
  			const errorData = axiosErr.response?.data ?? { message: axiosErr.message };
  			throw new Error(errorData.message ?? 'Failed to login');
		}
	},

	get: async (userId: string):Promise<getUserResp | null> => {
		try {
			const response = await httpCall.get (`${BASE_URL}/${userId}`);
			console.log('⭐ getUser success ✅', response.data);
			return response.data;
		} catch (error: any) {
			console.log('❌ Failed to get user info');
			const axiosErr = error as AxiosError<{ message?: string }>;
  			const errorData = axiosErr.response?.data ?? { message: axiosErr.message };
  			throw new Error(errorData.message ?? 'Failed to get user info');
		}
	},

	logout: async (): Promise<void> => {
		try {
			await httpCall.post (`${BASE_URL}/logout`);
			console.log('⭐ logoutUser success ✅ (no response body)');
		} catch (error: any) {
			console.log('❌ Failed to logout');
			const axiosErr = error as AxiosError<{ message?: string }>;
  			const errorData = axiosErr.response?.data ?? { message: axiosErr.message };
			throw new Error(errorData.message ?? 'Failed to logout');
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
			const response = await httpCall.post (`${BASE_URL}`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			console.log('⭐ createUser success ✅', response.data);
			return response.data;
		} catch (error: any) {
			console.log('❌ Failed to create a user');
			const axiosErr = error as AxiosError<{ message?: string }>;
			const errorData = axiosErr.response?.data ?? { message: axiosErr.message };
			throw new Error(errorData.message ?? 'Failed to create a user');
		}
	},

	delete: async (): Promise<void> => {
		try {
			await httpCall.delete (`${BASE_URL}`);
			console.log('⭐ deleteUser success ✅, (no response body)');
		} catch (error: any) {
			console.log('❌ Failed to delete user');
			const axiosErr = error as AxiosError<{ message?: string }>;
			const errorData = axiosErr.response?.data ?? { message: axiosErr.message };
			throw new Error(errorData.message ?? 'Failed to delete user');
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
			const response = await httpCall.put (`${BASE_URL}/me`, cleanData);
			console.log('⭐ updateUser success ✅', response.data);
			return response.data;
		} catch (error: any) {
			console.log('❌ Failed to update user');
			const axiosErr = error as AxiosError<{ message?: string }>;
			const errorData = axiosErr.response?.data ?? { message: axiosErr.message };
			throw new Error(errorData.message ?? 'Failed to update user');
		}
	},

	updateAvatar: async (file: File): Promise<updateAvatarResp | null> => {
		const formData = new FormData();
		if (file) {
			formData.append('avatarFile', file);
		}
		try {
			const response = await httpCall.post (`${BASE_URL}/upload`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			console.log('⭐ updateAvatar success ✅', response.data);
			return response.data;
		} catch (error: any) {
			console.log('❌ Failed to update avatar');
			const axiosErr = error as AxiosError<{ message?: string }>;
			const errorData = axiosErr.response?.data ?? { message: axiosErr.message };
			throw new Error(errorData.message ?? 'Failed to update avatar');
		}
	}
}
