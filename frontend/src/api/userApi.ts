const BASE_URL = 'http://localhost:3000/api/users';

import { UserState } from "../types";


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
export type LoginUserResp = Pick<UserState, 'accessToken' | 'id'>

// response when get user
export type getUserResp = Omit<UserState, 'isLoggedIn' | 'accessToken' | 'createdAt' | 'updatedAt'>

// response update user
export type updateUserResp = Pick<UserState, 'name' | 'surname' | 'displayName' | 'avatarFile'>

// response update Avatar
export type updateAvatarResp = Pick<UserState, 'id' | 'email' | 'name' | 'surname' | 'displayName' | 'avatarUrl' | 'isOnline' | 'createdAt' | 'updatedAt'>
 
export const userApi = {

	login: async (email:string, password:string): Promise<LoginUserResp | null> => {
		const response = await fetch (`${BASE_URL}/login`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				email: email,
				password: password
			})
		});
		if (!response.ok)
			throw new Error(`❌ Failed to login: ${response.statusText}`);
		const result = await response.json();
		console.log('⭐ loginUser success ✅', result);
		return result;
	},

	logout: async (accessToken: string): Promise<void> => {
		const response = await fetch (`${BASE_URL}/logout`, {
			method: 'POST',
			headers: {'Authorization': `Bearer ${accessToken}`}
		});
		if (!response.ok)
			throw new Error(`❌ Failed to logout: ${response.statusText}`);
		console.log('⭐ logoutUser success ✅ (no response body)');
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
		const response = await fetch (`${BASE_URL}`, {
			method: 'POST',
			body: formData
		});
		if (!response.ok)
			throw new Error(`❌ Failed to create a user : ${response.statusText}`);
		const result = await response.json();
		console.log('⭐ createUser success ✅', result);
		return result;
	},

	get: async (userId: string, accessToken: string):Promise<getUserResp | null> => {
		const response = await fetch (`${BASE_URL}/${userId}`, {
			method: 'GET',
			headers:{
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`}
			}
		);
		if (!response.ok)
			throw new Error(`❌ Failed to get user info: ${response.statusText}`);
		const result = await response.json();
		console.log('⭐ getUser success ✅', result);
		return result;
	},

	delete: async (accessToken: string): Promise<void> => {
		const response = await fetch (`${BASE_URL}`, {
			method: 'DELETE',
			headers: {'Authorization': `Bearer ${accessToken}`}
		})
		if (!response.ok)
			throw new Error(`❌ Failed to delete user: ${response.statusText}`);
		console.log('⭐ deleteUser success ✅, (no response body)');
	},

	update: async (accessToken: string, data: Partial<UserState>): Promise<updateUserResp> => {
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
		const response = await fetch (`${BASE_URL}/me`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`
			},
			body: JSON.stringify(cleanData)
		})
		if (!response.ok)
			throw new Error(`❌ Failed to update user: ${response.statusText}`);
		const result = await response.json();
		console.log('⭐ updateUser success ✅', result);
		return result;
	},

	updateAvatar: async (accessToken: string, file: File): Promise<updateAvatarResp | null> => {
		const formData = new FormData();
		if (file) {
			formData.append('avatarFile', file);
		}
		const response = await fetch (`${BASE_URL}/upload`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			},
			body: formData
		});
		if (!response.ok)
			throw new Error(`❌ Failed to update avatar: ${response.statusText}`);
		const result = await response.json();
		console.log('⭐ updateAvatar success ✅', result);
		return result;
	}
}