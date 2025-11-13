import { userService } from "../services/UserService";
import { userStore } from "../store/UserStorage";

export function testBackend(id: string): void {
	if (id)
	{
		const root : HTMLElement | null = document.getElementById(id);
		if (root)
		{
			root.innerHTML = /*html*/`
				<div class='grid h-screen'>
					<div class='place-self-center place-content-center'>
						<h1 class='text-3xl'>Backend test</h1>
						<button id="create-user-btn" class="btn-primary">Create User</button>
						<div id="createResponse" class="rounded-xl bg-white"></div>
						<button id="login-btn" class="btn-primary">Login</button>
						<div id="loginResponse" class="rounded-xl bg-white"></div>
						<button id="logout-btn" class="btn-primary">Logout</button>
						<div id="logoutResponse" class="rounded-xl bg-white"></div>
						<button id="delete-btn" class="btn-primary">delete</button>
						<div id="deleteResponse" class="rounded-xl bg-white"></div>
						<button id="update-btn" class="btn-primary">update</button>
						<div id="updateResponse" class="rounded-xl bg-white"></div>
					</div>
				</div>
			`;

			// Create user
			const createUserBtn = document.getElementById('create-user-btn');
			if (createUserBtn)
			{
				createUserBtn.addEventListener('click', async () => {
					try {
						const user = await userService.createUser({
							email: "ok@ok.com",
							name: "Ly-Sha",
							surname: "Than",
							password: "1234",
							avatarFile: null
						});
						const createResponse = document.getElementById('createResponse');
						createResponse!.innerHTML = `user as been created : ${userStore.getUserInfo().name} id = ${userStore.getUserId()}`;
					} catch (error) {
						console.log(error);
						const createResponse = document.getElementById('createResponse');
						createResponse!.innerHTML = `${error}`;
					}
				});
			}

			// Login
			const loginBtn = document.getElementById('login-btn');
			if (loginBtn)
			{
				loginBtn.addEventListener('click', async () => {
					try {
						const user = await userService.loginUser("ok@ok.com","1234");
						const loginResponse = document.getElementById('loginResponse');
						loginResponse!.innerHTML = `successful login with : ${user.name} in session id : ${user.accessToken}`;
						console.log(`successful login with : ${user.name} in session id : ${user.accessToken}`);
					} catch (error) {
						console.log(error);
						const loginResponse = document.getElementById('loginResponse');
						loginResponse!.innerHTML = `${error}`;
					}
				});
			}

			// logout user
			const logoutBtn = document.getElementById('logout-btn');
			if (logoutBtn)
			{
				logoutBtn.addEventListener('click', async () => {
					try {
						await userService.logoutUser();
						const logoutResponse = document.getElementById('logoutResponse');
						logoutResponse!.innerHTML = `successfull logout`;
					} catch (error) {
						console.log(error);
						const logoutResponse = document.getElementById('logoutResponse');
						logoutResponse!.innerHTML = `${error}`;
					}
				});
			}

			// delete user
			const deleteBtn = document.getElementById('delete-btn');
			if (deleteBtn)
			{
				deleteBtn.addEventListener('click', async () => {
					try {
						await userService.deleteUser();
						const deleteResponse = document.getElementById('deleteResponse');
						deleteResponse!.innerHTML = `successful deleted`;
					} catch (error) {
						console.log(error);
						const deleteResponse = document.getElementById('deleteResponse');
						deleteResponse!.innerHTML = `${error}`;
					}
				});
			}

			// Update user
			const updateUserBtn = document.getElementById('update-btn');
			if (updateUserBtn)
			{
				updateUserBtn.addEventListener('click', async () => {
					try {
						const user = await userService.updateUser({
							name: "ooo",
							surname: "ooo",
							displayName: "ooo",
							avatarFile: null
						});
						const updateResponse = document.getElementById('updateResponse');
						updateResponse!.innerHTML = `user as been updated sucessfully : ${userStore.getUserInfo().name} id = ${userStore.getUserId()}`;
					} catch (error) {
						console.log(error);
						const updateResponse = document.getElementById('updateResponse');
						updateResponse!.innerHTML = `${error}`;
					}
				});
			}
		}
	}

}

// async function AddUserToDb() {
// 	try {
// 		const response = await fetch ('http://localhost:3000/api/users', {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json'
// 			},
// 			body: JSON.stringify({
// 				email: "lysha.than@gmail.com",
// 				name: "LySha",
// 				surname: "Than",
// 				password: "987654321",
// 				displayName: "lthan",
// 				avatarFile: null
// 			})
// 		});

// 		const data = await response.json();

// 		if (response.ok) {
// 			console.log(JSON.stringify(data, null, 2));
// 		}
// 		else {
// 			console.log('Failed to create user');
// 		}
// 	}
// 	catch (error) {
// 		const errorMessage = error instanceof Error
//             ? error.message
//             : 'An unknown error occurred';
// 		console.log('Failed to create user', errorMessage);
// 	}
// }
