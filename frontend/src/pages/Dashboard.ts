import { userStore } from "../store/UserStorage";
import { navigateTo } from "../main";
import { NavBar } from "../components/NavBar";

export function Dashboard() {
	if (!userStore.getUserAccessToken())
	{
		console.log('no session when access /login')
		navigateTo('/');
		return;
	}
	const root = document.getElementById('root');
	if (root)
	{
		root.innerHTML = /*html*/`

		<header id='navigation-bar'></header>



		<!-- First part : welcome / games / notifications -->
			<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
				<div class="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
					<div class="relative lg:row-span-2 rounded-lg bg-white">
						<h1>Welcome</h1>
					</div>
					<div class="relative max-lg:row-start-1 rounded-lg bg-white ">
						<h1>Games</h1>
					</div>
					<div class="relative max-lg:row-start-3 rounded-lg bg-white lg:col-start-2 lg:row-start-2">
						<h1>Games 2</h1>
					</div>
					<div class="relative lg:row-span-2 rounded-lg bg-white">
						<h1>Notifications</h1>

							<div class=" min-h-120"></div>


					</div>
				</div>
			</div>
		`
	}
	NavBar();

}
