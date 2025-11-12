export function FailedLoginPopUp(): void {
	console.log('FailedLoginPopUp');
	const popUp = document.getElementById('pop-up-failed-login');
	 if (popUp) {
        popUp.innerHTML = /*html*/`

		<div>
			<button onclick="this.closest('dialog').close()" class="outline-none float-right">X</button>
		</div>
		<div class="px-6 py-12 sm:rounded-lg sm:px-12">
			<h1 class="mb-10 text-xl">Create a new account</h1>
			<form action="/" method="POST" id='create-new-account-form' class="md:col-span-2">
				<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
					
					<div class="sm:col-span-3">
						<my-label labelFor="first-name">First name</my-label>
						<my-input inputId="first-name" inputType="text" inputName="first_name" inputAutoComplete="given-name"/>
					</div>

					<div class="sm:col-span-3">
						<my-label labelFor="last-name">Last name</my-label>
						<my-input inputId="last-name" inputType="text" inputName="last_name" inputAutoComplete="family-name"/>
					</div>

					<div class="col-span-full">
						<my-label labelFor="email">Email</my-label>
						<my-input inputId="sign-in-email" inputType="email" inputName="email" inputAutoComplete="email"/>
					</div>

					<div class="col-span-full">
						<my-label labelFor="username">Username</my-label>
						<my-input inputId="username" inputType="text" inputName="username" inputAutoComplete="username"/>
					</div>

					<div class="col-span-full">
						<my-label labelFor="password">Password</my-label>
						<my-input inputId="sign-in-password" inputType="password" inputName="password" inputAutoComplete="current-password"/>
					</div>

					<div class="col-span-full">
						<my-label labelFor="confirm-password">Confirm password</my-label>
						<my-input inputId="confirm-password" inputType="password" inputName="confirm_password" inputAutoComplete="current-password"/>
					</div>
				</div>
				<div class="mt-8 flex">
					<button id='save-btn' type="submit" class="btn-primary bg-white hover:bg-black">Save</button>
				</div>
			</form>

		</div>

        `;
    }

}