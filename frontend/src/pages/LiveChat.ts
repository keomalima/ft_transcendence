import type { AppContext, ChatMessage, FriendPaginationMap, UserState, GameHistory } from "../types.js";
import { router } from "../main.js";

// Import UI components
import "../components/NavBar.js";
import "../components/FriendList.js";
import "../components/FriendProfilePopUp.js";
import { friendshipApi } from "../api/friendshipApi.js";
import { ChatConnection } from "../websocket/ChatConnection.js";
import { chatApi } from "../api/chatApi.js";
import { gameService } from "../services/GameService.js";
import { tournamentApi } from "../api/tournamentApi.js";

let chatConnection: ChatConnection | null = null;
let _selectedFriend: any = null;
let paginationMap: FriendPaginationMap = {};
let wsListenerAttached = false;
export const unreadNotificationSet = new Set<string>();
let isUserInGameOrTournament = false;
let isFriendInGameOrTournament = false;
// sender -> gameId
const pendingInviteMap = new Map<string, string>();




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
		await refreshIsUserInGameOrTournament(ctx);
		renderLiveChatContent(ctx);       // Build and insert the layout
		passContext(ctx);                 // Pass ctx to components like <friend-list>
		await fetchUnreadSendersFromBackend(ctx); // Fetch new messages from backend when come back to the livechat page
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
				<p class="text-gray-900 text-xl font-semibold italic text-center block">👈 Select a friend to start chatting!</p>
			</div>

			<!-- Dialog for friend profile -->
 			<dialog id="friend-profile-dialog"  class="self-center m-auto w-[90vw] h-fit lg:w-[80vw]  max-h-[80vh] p-0 rounded-lg bg-cream backdrop:bg-black backdrop:bg-opacity-50">
				<friend-profile-pop-up id="friend-profile-component" class="w-full h-full overflow-y-auto"></friend-profile-pop-up>
			</dialog>  

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

		if (friendListComponent.skipAutoSelect) {
			friendListComponent.skipAutoSelect = false;
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
				chatEmptyMessage.innerHTML = `
							<span class="text-gray-900 text-xl font-semibold italic text-center block">
								🫤 You have no friends yet. Add some to start chatting!
							</span>
						`;			
					}
		} else {
			chatRight.classList.add('hidden');
			chatEmpty.classList.remove('hidden');

			const chatEmptyMessage = chatEmpty.querySelector('p');
			if (chatEmptyMessage) {
				chatEmptyMessage.innerHTML = `
					<span class="text-gray-900 text-xl font-semibold italic text-center block">
						👈 Select a friend to start chatting!
					</span>
				`;
			}
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

		// // STEP 1: Remove from localStorage unread set
		if (unreadNotificationSet.has(clickedFriend.id)) {
			unreadNotificationSet.delete(clickedFriend.id);

			try {
				await chatApi.deleteNotification(clickedFriend.id); // Call backend to remove
			} catch (err) {
				console.error("❌ Failed to delete notification from backend:", err);
			}
		}

		// STEP 2: Reload friend list (to refresh red ! badges)
		await friendListComponent.loadAndRender();
		const updatedList = friendListComponent._list;

		// STEP 3: Find and set selected friend
		const updatedFriend = updatedList?.find((f: any) => f.id === clickedFriend.id);
		if (!updatedFriend) return;
		_selectedFriend = updatedFriend;
		await refreshIsUserInGameOrTournament(ctx);
		isFriendInGameOrTournament = false;	

		// STEP 4: get the selected friend history
		const friendHistory: GameHistory[] = await friendshipApi.getFriendHistory(_selectedFriend.id);

		const FriendPofileComponent = document.getElementById('friend-profile-component') as any;
		if (FriendPofileComponent) {
			FriendPofileComponent.ctx = ctx;
			FriendPofileComponent.friendHistory = friendHistory;
			FriendPofileComponent.friend = _selectedFriend;
		}
		// STEP 4: Render chat box
		const chatRight = document.getElementById('chat-right');
		if (!chatRight) return;
		renderChatBox(_selectedFriend, ctx);
	});

	// WS message event: receive chat from a friend
	if (!wsListenerAttached) {
		window.addEventListener("ws-new-message", async (e: Event) => {
			const currentUserId = ctx.userStore.get()?.id;
			if (!currentUserId) return;

			const detail = (e as CustomEvent).detail as any;
			const fromUserId = detail.fromUserId as string;
			const content = (detail.content as string | null) ?? "";
			const messageType = detail.messageType as "TEXT" | "GAME_INVITE";
			const gameId = detail.gameId as string | undefined;


			// CASE 1: If the friend is currently selected, show the bubble
			if (_selectedFriend?.id === fromUserId) {

				if (messageType === "TEXT") {
					await refreshIsUserInGameOrTournament(ctx);
					await renderChatBox(_selectedFriend, ctx);
					return;
				}

				const chatBox = document.getElementById("chat-messages");
				if (chatBox) {
					const bubble = document.createElement("div");
					bubble.className = "flex justify-start";

					if (messageType === "GAME_INVITE") {
						if (gameId) {
							// 1) save gameId
							pendingInviteMap.set(fromUserId, gameId);

							const inviteBtn = document.getElementById("invite-game-btn") as HTMLButtonElement | null;
							if (inviteBtn) {
								inviteBtn.classList.add("hidden");
								inviteBtn.disabled = true; 
							}

							// 2) show accept/decline in header immediately
							const inviteActions = document.getElementById("invite-actions");
							if (inviteActions && !isUserInGameOrTournament) {
								inviteActions.innerHTML = `
									<button
										id="accept-invite-btn"
										class="px-4 py-1.5 text-sm font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition-shadow shadow-sm hover:shadow-md"
									>
										✅ Accept
									</button>
									<button
										id="decline-invite-btn"
										class="px-4 py-1.5 text-sm font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition-shadow shadow-sm hover:shadow-md"
									>
										❌ Decline
									</button>
								`;

								bindInviteActionButtons(fromUserId, gameId, ctx);

							}
						}

						// Show a visible bubble
						bubble.innerHTML = `
							<div class="px-4 py-2 rounded-lg bg-green-100 text-black max-w-xs break-words">
								🎮 Game invite received
							</div>
						`;

					} else {
						bubble.innerHTML = `
							<div class="px-4 py-2 rounded-lg bg-green-100 text-black max-w-xs break-words">
							${content}
							</div>
						`;
					}

					chatBox.appendChild(bubble);
					chatBox.scrollTop = chatBox.scrollHeight;
				}
				return;
			}


			// CASE 2: Chat box not open

			if (messageType === "GAME_INVITE" && gameId) {
				pendingInviteMap.set(fromUserId, gameId);
			}

			if (!unreadNotificationSet.has(fromUserId)) {
				unreadNotificationSet.add(fromUserId);

				try {
					await chatApi.createNotification(fromUserId);
				} catch (err) {
					console.error("❌ Failed to create notification in backend:", err);
				}

				// Then update UI
				const friendList = document.getElementById("friend-list-component") as any;
				if (friendList?.loadAndRender) {
					friendList.skipAutoSelect = true;
					await friendList.loadAndRender();
				}
			}
		});

		wsListenerAttached = true;
	}

}

async function renderChatBox(friend: any, ctx: AppContext) {
	console.log('Game Store', ctx.gameStore.get());
	const chatRight = document.getElementById('chat-right');
	const chatEmpty = document.getElementById('chat-empty');
	if (!chatRight || !chatEmpty) return;

	const currentUserId = ctx.userStore.get()?.id;
	
	if (!currentUserId) {
		console.error('❌ No currentUserId found, cannot render chat box.');
		return;
	}

	isFriendInGameOrTournament = false;

	// ===== Fetch first 30 chat history =====
	let messages: ChatMessage[] = [];
	try {
		messages = await chatApi.fetchChatHistory(friend.id);
		if (messages.length > 0) {
			paginationMap[friend.id] = {
				oldestMessageId: messages[0].id,
				hasMoreMessages: messages.length === 30,
			};
		} else {
			paginationMap[friend.id] = {
				oldestMessageId: null,
				hasMoreMessages: false,
			};
		}
	} catch (error) {
		console.error('❌ Failed to load chat history:', error);
		paginationMap[friend.id] = {
			oldestMessageId: null,
			hasMoreMessages: false,
		};
	}
	
	await refreshIsUserInGameOrTournament(ctx);

	const isAnyInGame = isUserInGameOrTournament || isFriendInGameOrTournament;

	// receiver-side pending invite (friend -> me)
	const pendingGameId = await syncPendingInviteFromBackend(friend.id);
	const shouldHideInviteGameBtn = !!pendingGameId && !isUserInGameOrTournament;

	// user1-side: ask backend if I should see Go to Game with this friend
	const goToGameId = await syncGoToGameFromBackend(friend.id);

	const canShowGoToGame = !!goToGameId && !pendingGameId && !friend.isBlockedBy;

	chatRight.innerHTML = `
		<!-- Header -->
		<div class="flex justify-between items-center p-4 border-b">
			<div>
				<p class="font-bold text-lg">${friend.displayName}</p>
				<p class="text-gray-500 text-sm">${friend.isOnline ? 'Online' : 'Offline'}</p>
			</div>

			<div class="flex gap-2 items-center">
				<!-- See Profile -->
				<button
					id="see-profile-btn"
					class="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-shadow shadow-sm hover:shadow-md"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M5.121 17.804A13.937 13.937 0 0112 15c2.57 0 4.947.723 6.879 1.96M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					<span>See Profile</span>
				</button>

				<!-- Invite actions placeholder (Accept/Decline will go here later) -->
				<div id="invite-actions" class="flex gap-2 items-center"></div>

				<!-- Invite Game -->
				${shouldHideInviteGameBtn ? "" : `
				<button
					id="invite-game-btn"
					class="px-4 py-1.5 text-sm font-medium rounded-full transition-shadow shadow-sm hover:shadow-md
					${isAnyInGame || friend.isBlockedBy
						? 'bg-red-500 text-white cursor-not-allowed'
						: 'bg-green-600 text-white hover:bg-green-700'}"
					${(!canShowGoToGame && (isAnyInGame || friend.isBlockedBy)) ? 'disabled' : ''}
				>
					🎮 Invite Game
				</button>
				`}

				<!-- Block / Unblock -->
				<button
					id="block-toggle-btn"
					class="
						rounded-full px-4 py-1.5
						text-sm font-medium
						transition-shadow shadow-sm hover:shadow-md
						${friend.isBlocked
							? 'bg-green-600 text-white hover:bg-green-700'
							: 'bg-red-600 text-white hover:bg-red-700'}
					"
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
				${friend.displayName} has blocked you. You cannot send messages or invite to games.
			</div>
		` : `
			<div class="p-4 border-t">
				<form id="chat-form" class="flex items-center gap-2">
					<input
						type="text"
						id="chat-input"
						placeholder="Type your message here"
						class="flex-grow border rounded px-3 py-2"
					/>
					<button type="submit"
						class="text-xl px-3 py-2 bg-black text-white rounded-full hover:bg-gray-800">
						⬆️
					</button>
				</form>
			</div>
		`}
	`;

	
	// If this friend has sent a pending invite, show Accept/Decline buttons in header
	const inviteActions = document.getElementById("invite-actions");

	if (inviteActions && pendingGameId && !isUserInGameOrTournament) {
		inviteActions.innerHTML = `
			<button
				id="accept-invite-btn"
				class="px-4 py-1.5 text-sm font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition-shadow shadow-sm hover:shadow-md"
			>
				✅ Accept
			</button>

			<button
				id="decline-invite-btn"
				class="px-4 py-1.5 text-sm font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition-shadow shadow-sm hover:shadow-md"
			>
				❌ Decline
			</button>
		`;

		bindInviteActionButtons(friend.id, pendingGameId, ctx);
	} else if (inviteActions) {
		inviteActions.innerHTML = "";
	}

	// Auto scroll to bottom after inserting messages
	const chatBox = document.getElementById("chat-messages");
	if (chatBox) {

		// Scroll to bottom on first render
		requestAnimationFrame(() => {
			chatBox.scrollTop = chatBox.scrollHeight;
		});
		chatBox.onscroll = async () => {
			const state = paginationMap[_selectedFriend.id];
			if (chatBox.scrollTop === 0 && state?.hasMoreMessages && state.oldestMessageId && _selectedFriend) {
				console.log("🔼 Scrolled to top — loading older messages...");

				const olderMessages = await chatApi.fetchChatHistory(_selectedFriend.id, state.oldestMessageId);				
				if (olderMessages.length === 0) {
					paginationMap[_selectedFriend.id].hasMoreMessages = false;
					console.log("🛑 No more older messages.");
					return;
				}

				if (olderMessages.length < 30) {
					paginationMap[_selectedFriend.id].hasMoreMessages = false;
				}

				// Update oldest ID
				paginationMap[_selectedFriend.id].oldestMessageId = olderMessages[0].id;

				// Save scroll height before inserting
				const previousHeight = chatBox.scrollHeight;

				// Render new messages and prepend
				const tempDiv = document.createElement("div");
				tempDiv.innerHTML = renderMessageBubbles(olderMessages, ctx.userStore.get()?.id || "");
				chatBox.prepend(...Array.from(tempDiv.children));

				// Restore scroll position
				requestAnimationFrame(() => {
					const newHeight = chatBox.scrollHeight;
					chatBox.scrollTop = newHeight - previousHeight;
				});
			}
		};
	}

	
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

	const inviteBtn = document.getElementById("invite-game-btn") as HTMLButtonElement | null;

	if (inviteBtn) {
		// Case A: show Go to Game for user1
		if (canShowGoToGame) {
			inviteBtn.textContent = "🟢 Go to Game";
			inviteBtn.className =
				"px-4 py-1.5 text-sm font-medium rounded-full transition-shadow shadow-sm hover:shadow-md bg-black text-white hover:bg-gray-800";
			inviteBtn.disabled = false;
			inviteBtn.onclick = () => router.navigateTo(`/game-room/${goToGameId}`);
		}
		// Case B: normal Invite Game
		else {
			inviteBtn.onclick = async () => {
				if (!_selectedFriend) return;
				if (inviteBtn.disabled) return;

				try {
					const res = await chatApi.sendMessage({
						toUserId: _selectedFriend.id,
						content: "I invite you to a game.",
						type: "GAME_INVITE",
					});

					if (res.status === "ok") {
						console.log("✅ Game invite sent successfully!");

						if (!res.gameId) {
							console.error("❌ Missing res.gameId for GAME_INVITE success:", res);
							alert("Invite sent but missing gameId from server.");
							return;
						}

						inviteBtn.textContent = "🟢 Go to Game";
						inviteBtn.className =
							"px-4 py-1.5 text-sm font-medium rounded-full transition-shadow shadow-sm hover:shadow-md bg-black text-white hover:bg-gray-800";
						inviteBtn.onclick = () => router.navigateTo(`/game-room/${res.gameId}`);
						return;
					}

					if (res.code === "BLOCKED") {
						showToast(`${_selectedFriend.displayName} has blocked you.`, "block");

						const updatedFriendList = await friendshipApi.getList();
						const updated = updatedFriendList.find((f) => f.id === _selectedFriend.id);
						if (updated) {
							_selectedFriend = updated;
							renderChatBox(_selectedFriend, ctx);
						}
						return;
					}

					if (res.code === "U_IN_GAME") {
						showToast("❌ You are already in a game or tournament.", "block");
						isUserInGameOrTournament = true;
						renderChatBox(_selectedFriend, ctx);
						return;
					}

					if (res.code === "F_IN_GAME") {
						showToast(`❌ ${_selectedFriend.displayName} is already in a game or tournament.`, "block");
						isFriendInGameOrTournament = true;
						renderChatBox(_selectedFriend, ctx);
						return;
					}

				} catch (err) {
					console.error("❌ Error sending game invite:", err);
					alert("An error occurred. Please try again.");
				}
			};
		}
	}


	const seeProfileBtn = document.getElementById('see-profile-btn');
	if (seeProfileBtn) {
		seeProfileBtn.addEventListener('click', () => {
			const profileDialog = document.getElementById('friend-profile-dialog') as HTMLDialogElement | null;
			if (profileDialog) profileDialog.showModal();
		});
	}

	const chatForm = document.getElementById("chat-form") as HTMLFormElement | null;
	const chatInput = document.getElementById("chat-input") as HTMLInputElement | null;

	if (chatForm && chatInput) {
		chatForm.addEventListener("submit", async (e) => {
			e.preventDefault();

			const content = chatInput.value.trim();
			if (!content || !_selectedFriend) return;

			const res = await chatApi.sendMessage({
				toUserId: _selectedFriend.id,
				content,
				type: "TEXT"
			});

			if (res.status === "ok") {
				const chatBox = document.getElementById("chat-messages");
				if (chatBox) {
					const bubble = document.createElement("div");
					bubble.className = "flex justify-end";
					bubble.innerHTML = `
						<div class="px-4 py-2 rounded-lg bg-blue-100 text-black max-w-xs break-words">
							${content}
						</div>
					`;
					chatBox.appendChild(bubble);
					chatBox.scrollTop = chatBox.scrollHeight;
				}
				chatInput.value = "";

			} else if (res.code === "BLOCKED") {
				showToast(`${_selectedFriend.displayName} has blocked you.`, "block");

				const updatedFriendList = await friendshipApi.getList();
				const updated = updatedFriendList.find((f) => f.id === _selectedFriend.id);
				if (updated) {
					_selectedFriend = updated;
					renderChatBox(_selectedFriend, ctx);
				}
			} else {
				alert(`Failed to send message: ${res.reason}`);
			}
		});

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

function renderMessageBubbles(messages: ChatMessage[], currentUserId: string): string {
	if (!Array.isArray(messages)) return '';

	return messages
		.filter(msg => msg && msg.senderId && msg.receiverId && msg.sentAt && msg.messageType)
		.map(msg => {
			// Only show GAME_INVITE when it's pending + has gameId
			if (msg.messageType === "GAME_INVITE") {
				if (!msg.gameId || msg.gameStatus !== "PENDING") return "";

				const isSender = msg.senderId === currentUserId;

				return `
					<div class="flex ${isSender ? 'justify-end' : 'justify-start'}">
						<div class="px-4 py-2 rounded-lg bg-yellow-100 text-black max-w-xs break-words">
							🎮 Game invite pending
						</div>
					</div>
				`;
			}

			// Normal TEXT message bubble
			const isSender = msg.senderId === currentUserId;
			const bubbleColor = isSender ? 'bg-blue-100' : 'bg-green-100';
			const textColor = 'text-black';

			return `
				<div class="flex ${isSender ? 'justify-end' : 'justify-start'}">
					<div class="px-4 py-2 rounded-lg ${bubbleColor} ${textColor} max-w-xs break-words">
						${msg.content ?? ""}
					</div>
				</div>
			`;
		})
		.join('');
}



async function fetchUnreadSendersFromBackend(ctx: AppContext) {
	const currentUserId = ctx.userStore.get()?.id;
	if (!currentUserId) return;

	try {
		// Step 1: Call backend to get unread senderIds
		const senderIds: string[] = await chatApi.getFriendsWithNewMessages();
		if (!senderIds || senderIds.length === 0) return;

		// Step 2: Store them in frontend Set (in-memory)
		for (const senderId of senderIds) {
			unreadNotificationSet.add(senderId);
		}

		// Step 3: Re-render FriendList to show blue dots
		const friendList = document.getElementById("friend-list-component") as any;
		if (friendList?.loadAndRender) {
			friendList.skipAutoSelect = true;
			await friendList.loadAndRender();
		}
	} catch (err) {
		console.error("❌ Failed to fetch unread senders from backend:", err);
	}
}

function bindInviteActionButtons(friendId: string, gameId: string, ctx: AppContext) {
	const acceptBtn = document.getElementById("accept-invite-btn") as HTMLButtonElement | null;
	const declineBtn = document.getElementById("decline-invite-btn") as HTMLButtonElement | null;

	if (!acceptBtn || !declineBtn || !gameId) return;

	acceptBtn.onclick = async () => {
		// safety check
		if (isUserInGameOrTournament) {
			showToast("❌ You are already in a game or tournament.", "block");
			return;
		}

		acceptBtn.disabled = true;
		declineBtn.disabled = true;

		try {
			// 1) Call backend: join game by gameId (no token needed)
			const res = await chatApi.joinGameFromChat({ gameId });

			if (res.status !== "ok") {
				console.error("❌ joinGameFromChat failed:", res);
				showToast(res.reason || "❌ Failed to join the game.", "block");
				acceptBtn.disabled = false;
				declineBtn.disabled = false;
				return;
			}

			// 2) Clear pending invite state + header UI
			pendingInviteMap.delete(friendId);
			const inviteActions = document.getElementById("invite-actions");
			if (inviteActions) inviteActions.innerHTML = "";

			isUserInGameOrTournament = true;

			// 3) Go to game room
			router.navigateTo(`/game-room/${gameId}`);
		} catch (err) {
			console.error("❌ joinGameFromChat error:", err);
			showToast("❌ Failed to join the game.", "block");
			acceptBtn.disabled = false;
			declineBtn.disabled = false;
		}
	};

	declineBtn.onclick = async () => {
		declineBtn.disabled = true;
		acceptBtn.disabled = true;

		try {
			// Step 1: call backend
			const res = await chatApi.declineGameFromChat({ gameId });

			if (!res || res.status !== "ok") {
				showToast(res?.reason || "❌ Failed to decline invite.", "block");
				declineBtn.disabled = false;
				acceptBtn.disabled = false;
				return;
			}

			// Step 2: clear local pending state + header UI
			pendingInviteMap.delete(friendId);

			const inviteActions = document.getElementById("invite-actions");
			if (inviteActions) inviteActions.innerHTML = "";

			const inviteBtn = document.getElementById("invite-game-btn") as HTMLButtonElement | null;
			if (inviteBtn) {
				inviteBtn.classList.remove("hidden");
				inviteBtn.disabled = false;
			}

			showToast("Invite declined", "block");

			if (_selectedFriend) {
				await refreshIsUserInGameOrTournament(ctx);
				renderChatBox(_selectedFriend, ctx);
			}
		} catch (err) {
			console.error("❌ declineGameFromChat error:", err);
			showToast("❌ Failed to decline invite.", "block");
			declineBtn.disabled = false;
			acceptBtn.disabled = false;
		}
	};
}

async function syncPendingInviteFromBackend(friendId: string): Promise<string | null> {
	try {
		const res = await chatApi.getPendingInvite(friendId);

		// if not ok -> clear stale state
		if (!res || res.status !== "ok") {
			pendingInviteMap.delete(friendId);
			return null;
		}

		const gameId = (res.gameId && res.gameId.trim() !== "") ? res.gameId : null;

		if (gameId) 
			pendingInviteMap.set(friendId, gameId);
		else 
			pendingInviteMap.delete(friendId);

		return gameId;
	} catch (err) {
		console.error("❌ syncPendingInviteFromBackend error:", err);
		pendingInviteMap.delete(friendId);
		return null;
	}
}

async function syncGoToGameFromBackend(friendId: string): Promise<string | null> {
	try {
		const res = await chatApi.getGoToGameId(friendId);
		if (!res || res.status !== "ok") return null;

		const gameId = (res.gameId && res.gameId.trim() !== "") ? res.gameId : null;
		return gameId;
	} catch (err) {
		console.error("❌ syncGoToGameFromBackend error:", err);
		return null;
	}
}

async function refreshIsUserInGameOrTournament(ctx: AppContext): Promise<void> {
	const currentGame = await getCurrentGame(ctx);
	const currentTournament = await getCurrentTournament();

	isUserInGameOrTournament = !!(currentGame?.gameId || currentTournament?.tournamentId);
}

// ======== GET CURRENT GAME ============
async function getCurrentGame(ctx: AppContext): Promise<{userId: string, gameId: string, type: string, status: string, token: string | null} | null> {
	try {
		const currentGame = await gameService.getCurrentGame(ctx);
		return currentGame;
	} catch(error) {
		console.log(error);
		return null;
	}
}

// ======== GET CURRENT TOURNAMENT ============
async function getCurrentTournament(): Promise<{userId: string, tournamentId: string, type: string, token: string | null} | null> {
	try {
		const currentTournament = await tournamentApi.getCurrentTournament();
		return currentTournament;
	} catch(error) {
		console.log(error);
		return null;
	}
}

// ======== CLEANUP HOOKS ==========
// when close the tab/page, close the ws
window.addEventListener("beforeunload", cleanLiveChatWS);
