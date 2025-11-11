import { userStore } from "../store/UserStorage";
import { UserState } from "../types";


// export interface UserState {
// 	id: string | null;
// 	email: string | null;
// 	name: string | null;
// 	surname: string | null;
// 	displayName: string | null;
// 	isLoggedIn: boolean;
// 	accessToken: string | null;
// 	isOnline: boolean;
// 	createdAt: string | null;
// 	updatedAt: string | null;
// }



// sending data to create a new user
interface CreateUserDto {
	email: string | null;
	name: string | null;
	surname: string | null;
	displayName: string | null;
	avatarUrl: string | null;
	city: string | null;
	password: string | null;
}
// type CreateUserDto = Omit<UserState, 'id' | 'isLoggedIn' | 'accessToken' | 'isOnline' | 'createdAt' | 'updatedAt' | 'avatarUrl' | 'city'>

// response when creating a new user
type CreateUserResp = Pick<UserState, 'id' | 'name' | 'email'>

// response when login
type LoginUserResp = Pick<UserState, 'accessToken' | 'email' | 'name' | 'isOnline'>

// response when get user
type getUserResp = Omit<UserState, 'isLoggedIn' | 'accessToken' | 'createdAt' | 'updatedAt'>

// response update user
type updateUserResp = Pick<UserState, 'name' | 'surname' | 'displayName' | 'avatarUrl' | 'city'>

const url = 'http://localhost:3000/api/users';

async function parseResponse(response: Response): Promise<any> {
	const text = await response.text();
	return text ? JSON.parse(text) : null;
}

class UserService {

	// create user
	async createUser(data: CreateUserDto): Promise<CreateUserResp>{
		console.log('create user dto : ', data);
		userStore.loadFromLocalStorage();
		const response = await fetch (`${url}`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(data)
		});
		if (!response.ok)
			throw new Error(`Failed to create user: ${response.statusText}`);


		const result = await response.json();
		if (result)
			console.log('user successfully created', result);

		// store user data in UserStore
		userStore.setUserId(result.id);
		userStore.setUserInfo(data);
		userStore.setUserLogStatus(result.isLoggedIn);

		// save to locat storage
		userStore.saveToLocalStorage();

		return result;
	}

	// login
	async loginUser(email:string, password:string): Promise<LoginUserResp>
	{
		userStore.loadFromLocalStorage();
		const response = await fetch (`${url}/login`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				email: email,
				password: password
			})
		});
		if (!response.ok)
			throw new Error(`Failed to login: ${response.statusText}`);

		const result = await response.json();
		if (result)
			console.log('successful login', result);

		// store user data in UserStore
		userStore.setUserAccessToken(result.accessToken);
		userStore.setUserLogStatus(result.isLoggedIn);

		// save to locat storage
		userStore.saveToLocalStorage();

		return result;
	}

	// logout
	async logoutUser(): Promise<void>
	{
		userStore.loadFromLocalStorage();
		const response = await fetch (`${url}/logout`, {
			method: 'POST',
			headers: {'Authorization': `Bearer ${userStore.getUserAccessToken()}`}
		});
		if (!response.ok)
			throw new Error(`Failed to logout: ${response.statusText}`);

		const result = parseResponse(response);
		if (result)
			console.log('successful logout', result);

		// update user state
		userStore.clearUserState();

		// save to locat storage
		userStore.saveToLocalStorage();

	}

	// get user
	async getUserState(): Promise<getUserResp | null> {
		userStore.loadFromLocalStorage();
		const response = await fetch (`${url}/${userStore.getUserId()}`, {
			method: 'GET',
			headers:{
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${userStore.getUserAccessToken()}`}
			}
		);
		if (!response.ok)
			throw new Error(`Failed to get user info: ${response.statusText}`);

		const result: getUserResp = await response.json();
		console.log('User informations successfully get', result);

		// store data in user storage
		userStore.setUserInfo(result);

		// save to locat storage
		userStore.saveToLocalStorage();

		return result;
	}

	// delete user
	async deleteUser(): Promise<void> {
		userStore.loadFromLocalStorage();
		const response = await fetch (`${url}`, {
			method: 'DELETE',
			headers: {'Authorization': `Bearer ${userStore.getUserAccessToken()}`}
		})
		if (!response.ok)
			throw new Error(`Failed to delete user: ${response.statusText}`);

		const result = parseResponse(response);
		if (result)
			console.log('User successfully deleted', result);

		// delete user data from storage
		userStore.clearUserState();

		// save to locat storage
		userStore.saveToLocalStorage();
	}

	// update user
	async updateUser(data: Partial<UserState>): Promise<updateUserResp> {
		// userStore.loadFromLocalStorage();

		// Filter out null, undefined, and empty strings
		const cleanData = Object.fromEntries(
			Object.entries(data).filter(([_, value]) =>
				value !== null &&
				value !== undefined &&
				value !== ''
			)
		);

		// Don't send request if no data to update
		if (Object.keys(cleanData).length === 0) {
			throw new Error('No fields to update');
		}

		const response = await fetch (`${url}/me`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${userStore.getUserAccessToken()}`
			},
			body: JSON.stringify(cleanData)
		})
		if (!response.ok)
			throw new Error(`Failed to update user: ${response.statusText}`);

		const result = await response.json();
		if (result)
			console.log('user successfully updated', result);

		// change user data in UserStore
		userStore.setUserInfo(data);

		// save to locat storage
		userStore.saveToLocalStorage();

		return result;
	}
}

export const userService = new UserService();
