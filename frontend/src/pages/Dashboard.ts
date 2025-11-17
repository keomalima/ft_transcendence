// import { userStore } from "../store/UserStorage";
// import { userService } from "../services/UserService";
// import { navigateTo } from "../main";
// import { NavBar } from "../components/NavBar";
// import { MatchHistory } from "../components/MatchHistory";
// import { FriendList } from "../components/FriendList";
// import { FriendRequests } from "../components/FriendRequests";
// import { AddFriend } from "../components/AddFriend";

// export function Dashboard() {
// 	if (!userStore.getUserAccessToken())
// 	{
// 		console.log('no session when access /login')
// 		navigateTo('/');
// 		return;
// 	}
// 	userService.getUserState();
// 	const root = document.getElementById('root');
// 	if (root)
// 	{
// 		root.innerHTML = /*html*/`

// 		<header id='navigation-bar'></header>

// 		<!-- First part : welcome / games / notifications -->
// 		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
// 			<div class="mt-10 grid gap-4 sm:mt-16 lg:gap-6 lg:grid-cols-3 lg:grid-rows-3">
// 				<div class="lg:row-span-3 rounded-lg order-1 lg:order-0">
// 					<h1 class='text-4xl lg:text-4xl break-words'>Welcome,</br>${userStore.getUserName()}</h1>
// 				</div>
// 				<div class="relative rounded-lg bg-medium order-2 lg:order-0">
// 					<h1>Create a new gane</h1>
// 				</div>
// 				<div class="relative rounded-lg bg-medium order-3 lg:order-0 lg:col-start-2 lg:row-start-2">
// 					<h1>Join a game</h1>
// 				</div>
// 				<div class="relative rounded-lg bg-medium order-3 lg:order-0 lg:col-start-2 lg:row-start-3">
// 					<h1>Log out</h1>
// 				</div>
// 				<div id='achievements' class="relative lg:row-span-3 rounded-lg bg-white p-4 lg:p-10 order-4 lg:order-0">
// 					<h1>Your achievements</h1>
// 				</div>
// 			</div>
// 		</div>
// 		<!-- Second part : match history / friends -->
// 		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
// 			<div class="my-10 grid gap-4 lg:gap-6 lg:grid-cols-3 grid-rows-1">
// 				<div class="max-h-200 lg:col-span-2 min-w-0 order-3 lg:order-0">
// 					<div id='match' class='bg-white p-4 lg:p-10 shadow-sm rounded-lg h-full flex flex-col gap-3'></div>
// 				</div>
// 				<div class='flex flex-col col-span-1 gap-5 min-h-full'>
// 					<div id='friend-requests' class="p-4 lg:p-10 rounded-lg bg-white order-last lg:order-0 lg:col-start-3 lg:row-start-1">
// 						<h1>Friend requests</h1>
// 					</div>
// 					<div id='add-new-friend' class="p-4 lg:p-10 rounded-lg bg-white order-first lg:order-0 lg:col-start-3 lg:row-start-2">
// 						<h1>Add a new friend</h1>
// 					</div>
// 					<div id='friend-list' class="grow rounded-lg bg-white shadow-sm p-4 lg:p-10 order-2 lg:order-0 lg:col-start-3 lg:row-start-3 lg:row-span-3">
// 						<h1>List of friends</h1>
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 		`
// 	}
// 	NavBar();
// 	MatchHistory('match');
// 	FriendList('friend-list');
// 	FriendRequests('friend-requests', 'friend-cards');
// 	AddFriend('add-new-friend');
// 	// FriendRequests('achievements');
// }
