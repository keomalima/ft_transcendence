import { userService } from "../services/UserService";

export function testBackend(id: string) {
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
							email: "bye@example.com",
							name: "Ly-Sha",
							surname: "Than",
							password: "987654321",
							displayName: "bye",
							city: "Paris",
							avatarUrl: null
						});
						const createResponse = document.getElementById('createResponse');
						createResponse!.innerHTML = `user as been created : ${user.name} id = ${user.id}`;
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
						const user = await userService.logUser("lthan@example.com","987654321");
						const loginResponse = document.getElementById('loginResponse');
						loginResponse!.innerHTML = `user as been created : ${user.name}`;
					} catch (error) {
						console.log(error);
						const loginResponse = document.getElementById('loginResponse');
						loginResponse!.innerHTML = `${error}`;
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
// 				city: "Paris",
// 				avatarUrl: null
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
