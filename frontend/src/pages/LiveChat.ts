import type { AppContext, UserState } from "../types.js";
import { router } from "../main.js";

// Import UI components
import "../components/NavBar.js";
import "../components/FriendList.js";
import { friendshipApi } from "../api/friendshipApi.js";
import { ChatConnection } from "../websocket/ChatConnection.js";

let chatConnection: ChatConnection | null = null;
let _selectedFriend: any = null;

export function LiveChat(ctx: AppContext): string {
	const currentUser: UserState | null = ctx.userStore.get();

	// 1. Check user data
	// If user not logged in, redirect to home
	if (!currentUser || !currentUser.id) {
		setTimeout(() => router.navigateTo('/'), 0);
		return `<div class="flex items-center justify-center h-screen">Redirecting to home...</div>`;
	}

	// 2. Setup logic after render
	setTimeout(() => {
		renderLiveChatContent(ctx);       // Build and insert the layout
		passContext(ctx);                 // Pass ctx to components like <friend-list>
		setupLiveChatEventListeners(ctx); // Handle form submission, etc.
		setLiveChatWebSocket(currentUser.id!); // Set up WS connection
	}, 0);

	// 3. Return loading screen placeholder
	return `
		<div id="live-chat-content">
			<p class='flex items-center justify-center h-screen'>Loading Live Chat...</p>
		</div>
	`;
}

// ======== UPDATE CONTENT ========
function renderLiveChatContent(ctx: AppContext) {
	const content = document.getElementById("live-chat-content");
	if (!content) return;

	content.innerHTML = `
		<nav-bar id="nav-bar-component"></nav-bar>

		<div class="grid h-[90vh] gap-4 px-4 py-6 grid-rows-[auto_1fr_auto] lg:grid-cols-4 lg:grid-rows-1">
			<!-- Left: Friends list -->
			<div class="order-1 lg:order-1 lg:col-span-1 bg-white rounded-lg shadow p-4 h-[50vh] min-h-[300px] lg:h-auto overflow-y-auto">
				<friend-list id="friend-list-component"></friend-list>
			</div>

			<!-- Right: Chat box (dynamic) -->
			<div id="chat-right"
				class="order-2 lg:order-2 lg:col-span-3 bg-white rounded-lg shadow flex flex-col h-[50vh] min-h-[300px] lg:h-auto overflow-hidden hidden">
			</div>

			<!-- Right: Empty state (shown when no friend selected / no friends) -->
			<div id="chat-empty"
				class="order-2 lg:order-2 lg:col-span-3 bg-white rounded-lg shadow flex items-center justify-center h-[50vh] min-h-[300px] lg:h-auto">
				<p class="text-gray-500">Loading friend list ......</p>
			</div>

		</div>
	`;
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext) {
	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const friendListComponent = document.getElementById('friend-list-component') as any;
	if (friendListComponent) {
		friendListComponent.ctx = ctx;
	}
}

// ======== EVENT LISTENER ============
function setupLiveChatEventListeners(ctx: AppContext) {
	const friendListComponent = document.getElementById('friend-list-component') as any;
 
	// **** FRIEND LIST LOADED ****
	friendListComponent?.addEventListener('friends-loaded', (e: Event) => {
		const customEvent = e as CustomEvent;
		const friends = customEvent.detail as any[];

		const chatRight = document.getElementById('chat-right');
		const chatEmpty = document.getElementById('chat-empty');

		if (!chatRight || !chatEmpty) return;

		if (friends.length === 0) {
			// No friends → show empty panel
			chatRight.classList.add('hidden');
			chatEmpty.classList.remove('hidden');

			const chatEmptyMessage = chatEmpty.querySelector('p');
			if (chatEmptyMessage) {
				chatEmptyMessage.textContent = "You have no friends yet. Add some to start chatting!";
			}
		} else {
			// Select and store first friend
			_selectedFriend = friends[0];

			// Fill chat-right with the selected friend's info
			chatRight.innerHTML = `
				<!-- Header -->
				<div class="flex justify-between items-center p-4 border-b">
					<div>
						<p class="font-bold text-lg">${_selectedFriend.displayName}</p>
						<p class="text-gray-500 text-sm">
							${_selectedFriend.isOnline ? 'Online' : 'Offline'}
						</p>
					</div>
					<button class="border border-black rounded-full px-3 py-1 hover:bg-black hover:text-white transition">
						See Profile
					</button>
				</div>

				<!-- Messages -->
				<div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3">
					<!-- message list will go here later -->
				</div>

				<!-- Input -->
				<form id="chat-form" class="flex items-center p-4 border-t gap-2">
					<input
						type="text"
						id="chat-input"
						placeholder="Type your message here"
						class="flex-grow border rounded px-3 py-2"
					/>
					<button type="submit" class="text-xl px-3 py-2 bg-black text-white rounded-full hover:bg-gray-800">⬆️</button>
				</form>
			`;

			// ✅ Show the chat box
			chatEmpty.classList.add('hidden');
			chatRight.classList.remove('hidden');

		}
	});

	// **** DELETE FRIEND ****
	friendListComponent?.addEventListener('event-delete-friend', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;

		try {
			if (data.friendshipId) {
				await friendshipApi.delete(data.friendshipId);

				if (friendListComponent.loadAndRender) {
					await friendListComponent.loadAndRender();
				}
			}
		} catch (error) {
			console.log('Error deleting friend (LiveChat):', error);
		}
	});

	// **** BLOCK/UNBLOCK FRIEND ***
	friendListComponent?.addEventListener('event-toggle-block', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;

		try {
			if (data.friendId) {
				if (data.isBlocked) {
					await friendshipApi.unblock(data.friendId);
				} else {
					await friendshipApi.block(data.friendId);
				}

				if (friendListComponent.loadAndRender) {
					await friendListComponent.loadAndRender();
				}
			}
		} catch (error) {
			console.log('Error blocking/unblocking friend (LiveChat):', error);
		}
	});

	// **** When user clicks a friend ****
	friendListComponent?.addEventListener('friend-selected', (e: Event) => {
		const customEvent = e as CustomEvent;
		const friend = customEvent.detail;

		// Save the new selected friend
		_selectedFriend = friend;

		// Update the chat box UI
		const chatRight = document.getElementById('chat-right');
		if (!chatRight) return;

		chatRight.innerHTML = `
			<!-- Header -->
			<div class="flex justify-between items-center p-4 border-b">
				<div>
					<p class="font-bold text-lg">${_selectedFriend.displayName}</p>
					<p class="text-gray-500 text-sm">
						${_selectedFriend.isOnline ? 'Online' : 'Offline'}
					</p>
				</div>
				<button class="border border-black rounded-full px-3 py-1 hover:bg-black hover:text-white transition">
					See Profile
				</button>
			</div>

			<!-- Messages -->
			<div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3">
				<!-- message list will go here later -->
			</div>

			<!-- Input -->
			<form id="chat-form" class="flex items-center p-4 border-t gap-2">
				<input
					type="text"
					id="chat-input"
					placeholder="Type your message here"
					class="flex-grow border rounded px-3 py-2"
				/>
				<button type="submit" class="text-xl px-3 py-2 bg-black text-white rounded-full hover:bg-gray-800">⬆️</button>
			</form>
		`;
	});


}

function setLiveChatWebSocket(userId: string) {
	chatConnection = new ChatConnection();
	chatConnection.connect(userId);
}

export function cleanLiveChatWS() {
	if (chatConnection) {
		chatConnection.disconnect();
		chatConnection = null;
	}
}

// ======== CLEANUP HOOKS ==========
// when close the tab/page, close the ws
window.addEventListener("beforeunload", cleanLiveChatWS);
