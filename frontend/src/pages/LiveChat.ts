import type { AppContext, ChatMessage, FriendData, UserState, GameHistory } from "../types.js";
import { router } from "../main.js";

// Import UI components
import "../components/NavBar.js";
import "../components/FriendList.js";
import "../components/FriendProfilePopUp.js";
import { friendshipApi } from "../api/friendshipApi.js";
import { ChatConnection } from "../websocket/ChatConnection.js";
import { chatApi } from "../api/chatApi.js";

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
	setTimeout(async () => {
		const friendHistory: GameHistory[] = await friendshipApi.getFriendHistory("aeed7f34-cb33-458d-a73e-5ca09f10c319");
		renderLiveChatContent(ctx);       // Build and insert the layout
		passContext(ctx, friendHistory);                 // Pass ctx to components like <friend-list>
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

	content.innerHTML = /*html*/`
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

<!-- =========================================================== -->
<!-- =========== HERE IS THE FRIEND PROFILE FOR JOEY =========== -->
<!-- =========================================================== -->
			<a onclick="document.getElementById('friend-profile-dialog').showModal()" class="relative rounded-lg bg-black order-3 lg:order-0 lg:col-start-2 lg:row-start-2 flex items-center justify-center cursor-pointer">
				<p class='font-[Calistoga] m-5 text-white text-3xl cursor-pointer'>Show friend profile</p>
			</a>

			<!-- Dialog for friend profile -->
			<dialog id="friend-profile-dialog"  class="self-center m-auto w-[90vw] h-fit lg:w-[80vw]  max-h-[80vh] p-0 rounded-lg bg-cream backdrop:bg-black backdrop:bg-opacity-50">
				<friend-profile-pop-up id="friend-profile-component" class="w-full h-full overflow-y-auto"></friend-profile-pop-up>
			</dialog>
<!-- =========================================================== -->
<!-- =========== HERE IS THE FRIEND PROFILE FOR JOEY =========== -->
<!-- =========================================================== -->

		</div>
	`;
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext, friendHistory: GameHistory[]) {
	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const friendListComponent = document.getElementById('friend-list-component') as any;
	if (friendListComponent) {
		friendListComponent.ctx = ctx;
	}
// =========================================================== -->
// =========== HERE IS THE FRIEND PROFILE FOR JOEY =========== -->
// =========================================================== -->
	const FriendPofileComponent = document.getElementById('friend-profile-component') as any;
	if (FriendPofileComponent) {
		FriendPofileComponent.ctx = ctx;
		FriendPofileComponent.friendHistory = friendHistory;
		// here have to pass the right friend
		FriendPofileComponent.friend = {avatarUrl: "/uploads/avatars/default.jpg",
										displayName: "BobJohnson",
										friendshipId: "7334178a-6011-4a85-8379-c818af0464ee",
										id: "aeed7f34-cb33-458d-a73e-5ca09f10c319",
										isBlocked: false,
										isBlockedBy: false,
										isOnline: false,
										name: "Bob",
										surname: "Johnson"};
	}
// =========================================================== -->
// =========== HERE IS THE FRIEND PROFILE FOR JOEY =========== -->
// =========================================================== -->
}

// ======== EVENT LISTENER ============
function setupLiveChatEventListeners(ctx: AppContext) {
	const friendListComponent = document.getElementById('friend-list-component') as any;
	let manualClick = false;
 
	// **** FRIEND LIST LOADED ****
	friendListComponent?.addEventListener('friends-loaded', (e: Event) => {
		if (manualClick)
		{
			manualClick = false;
			return;
		}
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

			renderChatBox(_selectedFriend, ctx);
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
		const { friendId, isBlocked } = (e as CustomEvent).detail;
		const friend = friendListComponent._list?.find((f: Partial<FriendData>) => f.id === friendId);
		const displayName = friend?.displayName ?? 'Friend';

		try {
			if (friendId) {
				if (isBlocked === true) {
					await friendshipApi.unblock(friendId);
					showToast(`Unblocked: ${displayName}`, 'unblock');
				} else if (isBlocked === false) {
					await friendshipApi.block(friendId);
					showToast(`Blocked: ${displayName}`, 'block');
				}

				await friendListComponent.loadAndRender();
			}
		} catch (error) {
			console.log('Error blocking/unblocking friend:', error);
			showToast('Action failed', 'block');
		}
	});

	// **** When user clicks a friend ****
	friendListComponent?.addEventListener('friend-selected', async (e: Event) => {
		manualClick = true;

		const customEvent = e as CustomEvent;
		const clickedFriend = customEvent.detail;

		// 1. Re-fetch updated friend list
		await friendListComponent.loadAndRender();
		const updatedList = friendListComponent._list;

		// 2. Get the latest status of the clicked friend
		const updatedFriend = updatedList?.find((f: any) => f.id === clickedFriend.id);
		if (!updatedFriend) return;

		_selectedFriend = updatedFriend;

		// Update the chat box UI
		const chatRight = document.getElementById('chat-right');
		if (!chatRight) return;

		renderChatBox(_selectedFriend, ctx);
	});

	// **** Show msg for block/unblock at left-up corner ***
	function showToast(message: string, type: 'block' | 'unblock') {
		const toast = document.createElement('div');
		toast.textContent = message;

		toast.className = `
			fixed top-4 left-4 z-50
			min-w-[200px] text-center
			px-4 py-2 rounded shadow-lg
			text-white font-medium
			${type === 'block' ? 'bg-red-600' : 'bg-green-600'}
		`;

		document.body.appendChild(toast);

		setTimeout(() => {
			toast.remove();
		}, 2000);
	}


}

async function renderChatBox(friend: any, ctx: AppContext) {
	const chatRight = document.getElementById('chat-right');
	const chatEmpty = document.getElementById('chat-empty');
	if (!chatRight || !chatEmpty) return;

	const currentUserId = ctx.userStore.get()?.id;
	if (!currentUserId) {
		console.error('❌ No currentUserId found, cannot render chat box.');
		return;
	}

	// ===== Fetch chat history =====
	let messages: ChatMessage[] = [];
	try {
		messages = await chatApi.fetchChatHistory(friend.id);
	} catch (error) {
		console.error('❌ Failed to load chat history:', error);
	}

	chatRight.innerHTML = `
		<!-- Header -->
		<div class="flex justify-between items-center p-4 border-b">
			<div>
				<p class="font-bold text-lg">${friend.displayName}</p>
				<p class="text-gray-500 text-sm">
					${friend.isOnline ? 'Online' : 'Offline'}
				</p>
			</div>
			<button class="border border-black rounded-full px-3 py-1 hover:bg-black hover:text-white transition">
				See Profile
			</button>
		</div>

		<!-- Messages -->
		<div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3">
			${messages.length === 0
				? `<p class="text-gray-400 text-center mt-4">No messages yet. Say hi 👋 to your friend!</p>`
				: renderMessageBubbles(messages, currentUserId)
			}
		</div>

		<!-- Input -->
		${friend.isBlockedBy ? `
			<div class="p-4 border-t text-center text-red-500 font-semibold">
				${friend.displayName} has blocked you. You cannot send messages.
			</div>
		` : `
			<form id="chat-form" class="flex items-center p-4 border-t gap-2">
				<input
					type="text"
					id="chat-input"
					placeholder="Type your message here"
					class="flex-grow border rounded px-3 py-2"
				/>
				<button type="submit" class="text-xl px-3 py-2 bg-black text-white rounded-full hover:bg-gray-800">⬆️</button>
			</form>
		`}
	`;

	chatEmpty.classList.add('hidden');
	chatRight.classList.remove('hidden');
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

function renderMessageBubbles(messages: ChatMessage[], currentUserId: string): string {
	if (!Array.isArray(messages)) return '';

	return messages
		.filter(msg => msg && msg.senderId && msg.content && msg.receiverId)
		.map(msg => {
			const isSender = msg.senderId === currentUserId;

			return `
				<div class="flex ${isSender ? 'justify-end' : 'justify-start'}">
					<div class="px-4 py-2 rounded-lg ${isSender ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'} max-w-xs">
						${msg.content}
					</div>
				</div>
			`;
		}).join('');
}


// ======== CLEANUP HOOKS ==========
// when close the tab/page, close the ws
window.addEventListener("beforeunload", cleanLiveChatWS);
