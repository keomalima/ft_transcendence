import { NavBar } from "../components/NavBar";

export function Game() {
	const root = document.getElementById('root');
	if (root)
	{
		root.innerHTML = /*html*/`
			<header id='navigation-bar'></header>
		<div class="grid h-screen">

			<div class='place-self-center '>
				<h1 class="pb-10 text-3xl">Select playing mode</h1>
				<div class="grid place-content-center">
					<my-button custom='mb-10'>solo vs computer</my-button>
					<my-button>play with a friend</my-button>
				</div>
			</div>
		</div>
		`;
	}
	NavBar();
}
