import { CreateUserDto } from "../types";
import { User } from "../types";
import { LogedUser } from "../types";

const url = 'http://localhost:3000/api/users';
let id : string = '';

export class UserService {

	// create user
	async createUser(data: CreateUserDto): Promise<User>{

		const response = await fetch (`${url}`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(data)
		});
		if (!response.ok)
			throw new Error(`Failed to create user: ${response.statusText}`);

		const result = await response.json();
		console.log('user successfully created', result);
		id = result.id;
		return result;
	}

	// login
	async logUser(email:string, password:string): Promise<LogedUser>
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
		console.log('successful login', result);
		return result;
	}

	// get user
	// async getUser()
	// delete user
	// update user
}

export const userService = new UserService();
