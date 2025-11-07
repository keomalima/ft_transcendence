import { userData } from "../data/userData";
import { userStore } from "../store/userStorage";
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
type CreateUserDto = Omit<UserState, 'id' | 'isLoggedIn' | 'accessToken' | 'isOnline' | 'createdAt' | 'updatedAt' | 'avatarUrl' | 'city'>

// response when creating a new user
type CreateUserResp = Pick<UserState, 'id' | 'name' | 'email'>

// response when login
type LoginUserResp = Pick<UserState, 'accessToken' | 'email' | 'name' | 'isOnline'>

// response when get user
type getUserResp = Omit<UserState, 'isLoggedIn' | 'accessToken' | 'createdAt' | 'updatedAt'>

const url = 'http://localhost:3000/api/users';

async function parseResponse(response: Response): Promise<any> {
	const text = await response.text();
	return text ? JSON.parse(text) : null;
}

class UserService {


	// create user
	async createUser(data: CreateUserDto): Promise<CreateUserResp>{

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
		userStore.setUserName(result.name);
		userStore.setUserMail(result.mail);
		userStore.setUserLogStatus(result.isLoggedIn);

		return result;
	}

	// login
	async loginUser(email:string, password:string): Promise<LoginUserResp>
	{
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

		return result;
	}

	// logout
	async logoutUser(): Promise<void>
	{
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

	}

	// get user
	async getUserState(): Promise<getUserResp | null> {
		const response = await fetch (`${url}/${userStore.getUserId()}`, {
			method: 'GET',
			headers: {'Content-Type': 'application/json'}
			}
		);
		if (!response.ok)
			throw new Error(`Failed to get user info: ${response.statusText}`);

		const result: getUserResp = await response.json();
		console.log('User informations successfully get', result);

		// store data in user storage
		userStore.setUserInfo(result);

		return result;
	}

	// delete user
	async deleteUser(): Promise<void> {
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
	}
	// deleteUser()

	// update user
}

export const userService = new UserService();
