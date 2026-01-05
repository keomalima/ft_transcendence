import type { AppContext, ChatMessage, FriendData, UserState } from "../types.js";
import { router } from "../main.js";

// Import UI components
import "../components/NavBar.js";
import "../components/FriendList.js";
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
	let manualClick = false;
 
	// **** FRIEND LIST LOADED ****
	friendListComponent?.addEventListener('friends-loaded', async (e: Event) => {
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
			const currentUserId = ctx.userStore.get()?.id;
			if (currentUserId) {
				// REMOVE FIRST FRIEND from unread
				const key = `chat_unread_${currentUserId}`;
				try {
					const raw = localStorage.getItem(key);
					if (raw) {
						const unreadSet = new Set<string>(JSON.parse(raw));
						unreadSet.delete(friends[0].id);
						localStorage.setItem(key, JSON.stringify([...unreadSet]));
					}
				} catch (err) {
					console.error("Failed to update unread list in localStorage", err);
				}
			}
			await friendListComponent.loadAndRender();

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

	// **** When user clicks a friend ****
	friendListComponent?.addEventListener('friend-selected', async (e: Event) => {
		manualClick = true;

		const customEvent = e as CustomEvent;
		const clickedFriend = customEvent.detail;

		// STEP 1: Remove from localStorage unread set
		const currentUserId = ctx.userStore.get()?.id;
		const key = `chat_unread_${currentUserId}`;
		try {
			const raw = localStorage.getItem(key);
			if (raw) {
				const unreadSet = new Set<string>(JSON.parse(raw));
				unreadSet.delete(clickedFriend.id);
				localStorage.setItem(key, JSON.stringify([...unreadSet]));
			}
		} catch (err) {
			console.error("❌ Failed to update unread set after friend click:", err);
		}

		// STEP 2: Reload friend list (to refresh red ! badges)
		await friendListComponent.loadAndRender();
		const updatedList = friendListComponent._list;

		// STEP 3: Find and set selected friend
		const updatedFriend = updatedList?.find((f: any) => f.id === clickedFriend.id);
		if (!updatedFriend) return;
		_selectedFriend = updatedFriend;

		// STEP 4: Render chat box
		const chatRight = document.getElementById('chat-right');
		if (!chatRight) return;
		renderChatBox(_selectedFriend, ctx);
	});
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
				<p class="text-gray-500 text-sm">${friend.isOnline ? 'Online' : 'Offline'}</p>
			</div>
			<div class="flex gap-2">
				<button class="border border-black rounded-full px-3 py-1 hover:bg-black hover:text-white transition">
					See Profile
				</button>
				<button id="block-toggle-btn"
					class="${friend.isBlocked 
						? 'bg-green-600 text-white hover:bg-green-700' 
						: 'bg-red-600 text-white hover:bg-red-700'} 
						rounded-full px-3 py-1 transition font-semibold"
				>
					${friend.isBlocked ? 'Unblock your friend' : 'Block your friend'}
				</button>

			</div>
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
	
	const blockBtn = document.getElementById('block-toggle-btn');
	if (blockBtn) {
		blockBtn.addEventListener('click', async () => {
			try {
				if (friend.isBlocked) {
					await friendshipApi.unblock(friend.id);
					showToast(`Unblocked: ${friend.displayName}`, 'unblock');
				} else {
					await friendshipApi.block(friend.id);
					showToast(`Blocked: ${friend.displayName}`, 'block');
				}

				const updatedFriendList = await friendshipApi.getList();
				const updated = updatedFriendList.find((f) => f.id === friend.id);
				if (updated) {
					_selectedFriend = updated;
					renderChatBox(_selectedFriend, ctx);
				}
				} catch (error) {
					console.error('Error block/unblock:', error);
					showToast('Action failed', 'block');
			}
		});
	}

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
			const bubbleColor = isSender ? 'bg-blue-100' : 'bg-green-100';
			const textColor = 'text-black';

			return `
				<div class="flex ${isSender ? 'justify-end' : 'justify-start'}">
					<div class="px-4 py-2 rounded-lg ${bubbleColor} ${textColor} max-w-xs break-words">
						${msg.content}
					</div>
				</div>
			`;
		}).join('');
}


// ======== CLEANUP HOOKS ==========
// when close the tab/page, close the ws
window.addEventListener("beforeunload", cleanLiveChatWS);
