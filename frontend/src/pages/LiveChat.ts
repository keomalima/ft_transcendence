import type { AppContext, UserState } from "../types.js";
import { router } from "../main.js";

// Import UI components
import "../components/NavBar.js";
import "../components/FriendList.js";
import { friendshipApi } from "../api/friendshipApi.js";
import { ChatConnection } from "../websocket/ChatConnection.js";

let chatConnection: ChatConnection | null = null;

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

			<!-- Right: Chat box -->
			<div class="order-2 lg:order-2 lg:col-span-3 bg-white rounded-lg shadow flex flex-col h-[50vh] min-h-[300px] lg:h-auto overflow-hidden">
				<!-- Header -->
				<div class="flex justify-between items-center p-4 border-b">
					<div>
						<p class="font-bold text-lg">user1</p>
						<p class="text-gray-500 text-sm">Offline - Last seen today</p>
					</div>
					<button class="border border-black rounded-full px-3 py-1 hover:bg-black hover:text-white transition">
						See Profile
					</button>
				</div>

				<!-- Messages -->
				<div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3">
					<div class="max-w-xs bg-gray-200 text-sm p-2 rounded-lg">Hello!</div>
					<div class="text-right">
						<div class="inline-block max-w-xs bg-beige text-sm p-2 rounded-lg">Fine, you?</div>
						<div class="text-xs text-gray-400 mt-1">2 days ago - 10:00pm</div>
					</div>
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
