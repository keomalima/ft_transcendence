export function renderBackendStatus(id: string) {
	if (id)
	{
		const root : HTMLElement = document.getElementById(id);
		if (root)
		{
			root.innerHTML = /*html*/`
				<div class='grid h-screen'>
					<div class='place-self-center place-content-center'>
						<h1 class='text-3xl'>Backend test</h1>
						<button id="create-user-btn" class="btn-primary">Create User</button>
						<div id="response" class="rounded-xl bg-white"></div>
					</div>
				</div>
			`;

			const createUserBtn = document.getElementById('create-user-btn');
			const responseDiv = document.getElementById('response');

			if (createUserBtn)
			{
				createUserBtn.addEventListener('click', async () => {
					try {
						const response = await fetch ('http://localhost:3000/api/users', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								email: "lysha.than@gmail.com",
								name: "LySha",
								surname: "Than",
								password: "987654321",
								displayName: "lthan",
								city: "Paris",
								avatarUrl: null
							})
						});

						const data = await response.json();

						if (response.ok) {
							responseDiv!.innerHTML = /*html*/`
								<p class="text-green-600">✅ User created successfully!</p>
                   		    	<pre>${JSON.stringify(data, null, 2)}</pre>
							`;
						}
						else {
							responseDiv!.innerHTML = /*html*/`
								<p class="text-red-600">❌ Error: ${data.message || 'Failed to create user'}</p>
								<pre>${JSON.stringify(data, null, 2)}</pre>
							`;
						}
					}
					catch (error) {
						responseDiv!.innerHTML = /*html*/`
							<p class="text-red-600">❌ Network Error: ${error.message}</p>
						`;
					}
				});
			}
		}
	}

}
