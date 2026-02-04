import type { AppContext, ChatMessage, FriendPaginationMap, UserState } from "../types.js";
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
import { TournamentWsConnection } from "../websocket/TournamentConnection.js";

let chatConnection: ChatConnection | null = null;
let _selectedFriend: any = null;
let paginationMap: FriendPaginationMap = {};
let listenersAttached = false;
export const unreadNotificationSet = new Set<string>();
let isUserInGameOrTournament = false;
let isFriendInGameOrTournament = false;
const pendingInviteMap = new Map<string, string>();
let livechatTournamentId: string | null = null;
let tournamentConnection: TournamentWsConnection | null = null;
let wsNewMessageHandler: ((e: Event) => void) | null = null;
let connectedTournamentId: string | null = null;
let selectVersion = 0;




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
		await setupTournamentNotifAndWs(ctx, currentUser.id!);
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
			<!-- Left: Tournament Notif + Friends list -->

			<div class="order-1 lg:order-1 lg:col-span-1 bg-white rounded-lg shadow p-4 h-[50vh] min-h-[300px] lg:h-auto overflow-y-auto">
			
			<!-- Tournament notif box (hidden by default) -->
			<div id="tournament-notif" class="hidden mb-3 rounded-lg border border-gray-200 bg-yellow-50 p-3">
				<div class="flex items-start justify-between gap-2">
					<div>
						<p class="font-semibold text-gray-900">Tournament Notification</p>
						<p id="tournament-notif-text" class="text-sm text-gray-700 mt-1">Loading...</p>
					</div>
				</div>
			</div>

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

// ======== SET TOURNAMENT WS ========
async function setupTournamentNotifAndWs(ctx: AppContext, currentUserId: string) {
	const t = await getCurrentTournament();
	livechatTournamentId = t?.tournamentId ?? null;

	if (livechatTournamentId) {
		showTournamentNotifBox("📡 Connected. Waiting for tournament updates...");
		setTournamentWebSocket(livechatTournamentId, currentUserId, ctx);
	} else {
		hideTournamentNotifBox();
		tournamentConnection?.disconnect();
		tournamentConnection = null;
		connectedTournamentId = null;
		livechatTournamentId = null;
	}
}

// ======== EVENT LISTENER ============
function setupLiveChatEventListeners(ctx: AppContext) {
	if (listenersAttached) return;

 	listenersAttached = true;

	const friendListComponent = document.getElementById('friend-list-component') as any;
 
	// **** FRIEND LIST LOADED ****
	friendListComponent?.addEventListener("friends-loaded", (e: Event) => {
		if (friendListComponent.skipAutoSelect) {
			friendListComponent.skipAutoSelect = false;
			return;
		}

		const friends = (e as CustomEvent).detail as any[];
		const chatRight = document.getElementById("chat-right");
		const chatEmpty = document.getElementById("chat-empty");
		if (!chatRight || !chatEmpty) return;

		// If have a selected friend, keep chat UI unless friend disappeared
		if (_selectedFriend?.id) {
			const stillExists = friends.some((f) => f.id === _selectedFriend.id);
			if (stillExists) {
				return;
			}

			// Selected friend is gone -> reset selection and show empty
			_selectedFriend = null;
		}

		// No selection: show empty panel
		chatRight.classList.add("hidden");
		chatEmpty.classList.remove("hidden");

		const p = chatEmpty.querySelector("p");
		if (p) {
			p.textContent =
				friends.length === 0
				? "🫤 You have no friends yet. Add some to start chatting!"
				: "👈 Select a friend to start chatting!";
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
			// console.log('Error deleting friend (LiveChat):', error);
		}
	});

	// **** When user clicks a friend ****
	friendListComponent?.addEventListener("friend-selected", (e: Event) => {

		const clickedFriend = (e as CustomEvent).detail;
		const myVersion = ++selectVersion;

		_selectedFriend = clickedFriend;
		isFriendInGameOrTournament = false;

		renderChatShell(clickedFriend);

		const popup = document.getElementById("friend-profile-component") as any;
		if (popup) {
			popup.ctx = ctx;
			popup.friend = clickedFriend;
			popup.friendHistory = [];
		}

		setTimeout(async () => {
			if (myVersion !== selectVersion) return;
			try {
				const history = await friendshipApi.getFriendHistory(clickedFriend.id);
				if (myVersion !== selectVersion) return;

				const popup2 = document.getElementById("friend-profile-component") as any;
				if (popup2) {
					popup2.ctx = ctx;
					popup2.friend = clickedFriend;
					popup2.friendHistory = history;
				}
			} catch (err) {
				console.error("getFriendHistory failed:", err);
			}
		}, 0);

		if (unreadNotificationSet.has(clickedFriend.id)) {
			unreadNotificationSet.delete(clickedFriend.id);

			chatApi.deleteNotification(clickedFriend.id).catch((err) => {
				console.error("deleteNotification failed:", err);
				unreadNotificationSet.add(clickedFriend.id);
			});

			setTimeout(() => {
				if (friendListComponent?.loadAndRender) {
					friendListComponent.skipAutoSelect = true;
					friendListComponent.loadAndRender();
				}
			}, 0);
		}

		setTimeout(async () => {
			if (myVersion !== selectVersion) return;

			await renderChatBox(clickedFriend, ctx, myVersion);
			verifyStillFriend(clickedFriend.id, friendListComponent, ctx, myVersion);
		}, 0);
	});


	// WS message event: receive chat from a friend
	if (!wsNewMessageHandler) {
		wsNewMessageHandler = async (e: Event) => {
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
					const chatBox = document.getElementById("chat-messages");
					if (chatBox) {
						const bubble = document.createElement("div");
						bubble.className = "flex justify-start";

						const inner = document.createElement("div");
						inner.className = "px-4 py-2 rounded-lg bg-green-100 text-black max-w-xs break-words";
						inner.textContent = content;

						bubble.appendChild(inner);
						chatBox.appendChild(bubble);
						chatBox.scrollTop = chatBox.scrollHeight;

						const isInviteDecision =
							content === "✅ Accepted the game invite" ||
							content === "❌ Declined the game invite";

						if (isInviteDecision) {
							const v = selectVersion;
							setTimeout(async () => {
								if (_selectedFriend?.id !== fromUserId) return;
								if (v !== selectVersion) return;

								await refreshIsUserInGameOrTournament(ctx);
								if (_selectedFriend?.id !== fromUserId) return;
								await renderChatBox(_selectedFriend, ctx, selectVersion);
							}, 0);
						}

					}
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
								  inviteBtn.textContent = "⏳ Pending";
									inviteBtn.disabled = true;
									inviteBtn.onclick = null;
							}

							// 2) show accept/decline in header immediately
							const inviteActions = document.getElementById("invite-actions");
							if (inviteActions && !isUserInGameOrTournament) {
								inviteActions.replaceChildren();

								const accept = document.createElement("button");
								accept.id = "accept-invite-btn";
								accept.className =
									"px-4 py-1.5 text-sm font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition-shadow shadow-sm hover:shadow-md";
								accept.textContent = "✅ Accept";

								const decline = document.createElement("button");
								decline.id = "decline-invite-btn";
								decline.className =
									"px-4 py-1.5 text-sm font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition-shadow shadow-sm hover:shadow-md";
								decline.textContent = "❌ Decline";

								inviteActions.appendChild(accept);
								inviteActions.appendChild(decline);

								const v = selectVersion;
								bindInviteActionButtons(fromUserId, gameId, ctx, v);
							}
						}

						const inner = document.createElement("div");
						inner.className = "px-4 py-2 rounded-lg bg-green-100 text-black max-w-xs break-words";
						inner.textContent = "🎮 Game invite received";

						bubble.appendChild(inner);
					} else {
						const inner = document.createElement("div");
						inner.className = "px-4 py-2 rounded-lg bg-green-100 text-black max-w-xs break-words";
						inner.textContent = content;

						bubble.appendChild(inner);
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

				const friendList = document.getElementById("friend-list-component") as any;
				if (friendList?.loadAndRender) {
					friendList.skipAutoSelect = true;
					await friendList.loadAndRender();
				}
			}
		};

		window.addEventListener("ws-new-message", wsNewMessageHandler);
	}
}

async function renderChatBox(friend: any, ctx: AppContext, version: number) {
	const chatRight = document.getElementById('chat-right');
	const chatEmpty = document.getElementById('chat-empty');
	if (!chatRight || !chatEmpty) return;

	const isStale = () => version !== selectVersion || _selectedFriend?.id !== friend.id;
	if (isStale()) return;

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
		if (isStale()) return;
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
		if (isStale()) return;
		console.error('❌ Failed to load chat history:', error);
		paginationMap[friend.id] = {
			oldestMessageId: null,
			hasMoreMessages: false,
		};
	}

	await refreshIsUserInGameOrTournament(ctx);
	if (isStale()) return;

	const isAnyInGame = isUserInGameOrTournament || isFriendInGameOrTournament;

	const [pendingGameId, goToGameId] = await Promise.all([
		syncPendingInviteFromBackend(friend.id),
		syncGoToGameFromBackend(friend.id),
	]);
	if (isStale()) return;

	chatRight.innerHTML = /*html*/`
		<!-- Header -->
		<div class="flex flex-col lg:flex-row justify-between items-center p-4 border-b gap-3 mb-20">
			<div>
				<p class="font-bold text-lg">${escapeHtml(friend.displayName ?? "")}</p>
				<p class="text-gray-500 text-sm">${friend.isOnline ? 'Online' : 'Offline'}</p>
			</div>

			<div class="flex flex-wrap justify-center lg:justify-end items-center gap-1 lg:gap-2">
				<!-- See Profile -->
				<button
					id="see-profile-btn"
					class="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-1.5 text-xs lg:text-sm font-medium text-gray-700 hover:bg-gray-100 transition-shadow shadow-sm hover:shadow-md"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="hidden lg:block h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M5.121 17.804A13.937 13.937 0 0112 15c2.57 0 4.947.723 6.879 1.96M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					<span>See Profile</span>
				</button>

				<!-- Invite actions placeholder (Accept/Decline will go here later) -->
				<div id="invite-actions" class="flex gap-2 items-center"></div>

				<!-- Single Slot: Invite OR Go -->
				<button
					id="invite-game-btn"
					class="px-4 py-1.5 text-sm font-medium rounded-full transition-shadow shadow-sm hover:shadow-md"
				>
				...
				</button>

				<!-- Block / Unblock -->
				<button
					id="block-toggle-btn"
					class="
						rounded-full px-4 py-1.5
						text-sm font-medium
						transition-shadow shadow-sm hover:shadow-md
						${friend.isBlocked
							? 'bg-green-600 text-white text-xs lg:text-sm hover:bg-green-700'
							: 'bg-red-600 text-white text-xs lg:text-sm hover:bg-red-700'}
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
				${escapeHtml(friend.displayName ?? "")} has blocked you. You cannot send messages or invite to games.
			</div>
		` : `
			<div class="p-4 border-t">
				<form id="chat-form" class="flex items-center gap-2">
					<input
						type="text"
						id="chat-input"
						placeholder="Type your message here"
						maxlength="1000"
						class="flex-grow border rounded px-3 py-2"
					/>
					<button type="submit"
						class="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 transition-all hover:scale-105 shadow-sm">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
						</svg>
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

		bindInviteActionButtons(friend.id, pendingGameId, ctx, version);
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
		const thisFriendId = friend.id;
		chatBox.onscroll = async () => {
			if (_selectedFriend?.id !== thisFriendId) return;

			const state = paginationMap[thisFriendId];
			if (chatBox.scrollTop !== 0) return;
			if (!state?.hasMoreMessages || !state.oldestMessageId) return;

			// console.log("🔼 Scrolled to top — loading older messages...");

			const olderMessages = await chatApi.fetchChatHistory(thisFriendId, state.oldestMessageId);

			// guard again after await
			if (_selectedFriend?.id !== thisFriendId) return;

			if (olderMessages.length === 0) {
				paginationMap[thisFriendId].hasMoreMessages = false;
				// console.log("🛑 No more older messages.");
				return;
			}

			if (olderMessages.length < 30) {
				paginationMap[thisFriendId].hasMoreMessages = false;
			}

			paginationMap[thisFriendId].oldestMessageId = olderMessages[0].id;

			const previousHeight = chatBox.scrollHeight;

			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = renderMessageBubbles(olderMessages, currentUserId);
			chatBox.prepend(...Array.from(tempDiv.children));

			requestAnimationFrame(() => {
				const newHeight = chatBox.scrollHeight;
				chatBox.scrollTop = newHeight - previousHeight;
			});
		};

	}

	
	const blockBtn = document.getElementById('block-toggle-btn');
	if (blockBtn) {
		blockBtn.addEventListener('click', async () => {
			if (isStale()) return;
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
					renderChatBox(_selectedFriend, ctx, selectVersion);
				}
				} catch (error) {
					console.error('Error block/unblock:', error);
					showToast('Action failed', 'block');
			}
		});
	}

	const inviteBtn = document.getElementById("invite-game-btn") as HTMLButtonElement | null;

	if (inviteBtn) {
		const inTournament = !!livechatTournamentId;
		const receiverHasPending = !!pendingGameId && !isUserInGameOrTournament;

		// Source of truth: if backend says you have a game to go -> GO
		const shouldGo = !!goToGameId && !friend.isBlockedBy && !inTournament;

		const enabledClass =
			"px-4 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-shadow shadow-sm hover:shadow-md bg-black text-white hover:bg-gray-800";
		const disabledClass =
			"px-4 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-shadow shadow-sm bg-gray-300 text-gray-600 cursor-not-allowed";

		if (shouldGo) {
			inviteBtn.textContent = "🟢 Go to Game";
			inviteBtn.className = enabledClass;
			inviteBtn.disabled = false;
			if (goToGameId) {
				inviteBtn.onclick = () => router.navigateTo(`/game-room/${encodeURIComponent(goToGameId)}`);
			}

		}
		else {
			const disableInvite = inTournament || friend.isBlockedBy || isAnyInGame || receiverHasPending;

			// label depending on reason (optional but nice UX)
			if (inTournament) inviteBtn.textContent = "🏆 In Tournament";
			else if (friend.isBlockedBy) inviteBtn.textContent = "🚫 Blocked";
			else if (receiverHasPending) inviteBtn.textContent = "⏳ Pending";
			else if (isAnyInGame) inviteBtn.textContent = "⛔ In Game";
			else inviteBtn.textContent = "🎮 Invite Game";

			inviteBtn.className = disableInvite ? disabledClass : enabledClass;
			inviteBtn.disabled = disableInvite;
			inviteBtn.onclick = null;

			if (!disableInvite) {
				inviteBtn.onclick = async () => {
					if (!_selectedFriend) return;
					if (isStale()) return;

					const res = await chatApi.sendMessage({
						toUserId: _selectedFriend.id,
						content: "I invite you to a game.",
						type: "GAME_INVITE",
					});

					if (isStale()) return;

					if (res.status === "error") {
						if (res.code === "BLOCKED") {
							showToast(`${_selectedFriend.displayName} has blocked you.`, "block");

							const updatedFriendList = await friendshipApi.getList();
							if (isStale()) return;
							const updated = updatedFriendList.find((f) => f.id === _selectedFriend.id);
							if (updated) _selectedFriend = updated;

							await renderChatBox(_selectedFriend, ctx, selectVersion);
							return;
						}
						if (res.code === "U_IN_GAME") {
							showToast("❌ You are already in a game or tournament.", "block");
							isUserInGameOrTournament = true;
							renderChatBox(_selectedFriend, ctx, selectVersion);
							return;
						}
						if (res.code === "F_IN_GAME") {
							showToast(`❌ ${_selectedFriend.displayName} is already in a game or tournament.`, "block");
							isFriendInGameOrTournament = true;
							renderChatBox(_selectedFriend, ctx, selectVersion);
							return;
						}
						showToast(res.reason || "❌ Failed to send invite.", "block");
						return;
					}

					if (!res.gameId) {
						showToast("Invite sent but missing gameId.", "block");
						return;
					}

					// now in a game -> align with normal render logic
					isUserInGameOrTournament = true;

					// re-render the current chat using the normal rules
					if (_selectedFriend) {
						await renderChatBox(_selectedFriend, ctx, selectVersion);
					}
				};
			}
		
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

			try{
				const res = await chatApi.sendMessage({
					toUserId: _selectedFriend.id,
					content,
					type: "TEXT"
				});
				if (isStale()) return;
				if (res.status === "ok") {
					const chatBox = document.getElementById("chat-messages");
					if (chatBox) {
						const bubble = document.createElement("div");
						bubble.className = "flex justify-end";

						const inner = document.createElement("div");
						inner.className = "px-4 py-2 rounded-lg bg-blue-100 text-black max-w-xs break-words";
						inner.textContent = content;

						bubble.appendChild(inner);
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
						renderChatBox(_selectedFriend, ctx, selectVersion);
					}
				} else {
					alert(`Failed to send message: ${res.reason}`);
				}
			}
			catch (err) {
				if (isStale()) return;
				//console.error("send text failed:", err);
			}
		});

	}

	chatEmpty.classList.add('hidden');
	chatRight.classList.remove('hidden');
}

function setLiveChatWebSocket(userId: string) {
	if (chatConnection) return;
	chatConnection = new ChatConnection();
	chatConnection.connect(userId);
}

function setTournamentWebSocket(tournamentId: string, userId: string, ctx: AppContext) {
	// already connected to same tournament -> do nothing
	if (tournamentConnection && connectedTournamentId === tournamentId) return;

	// switch tournament or first connect
	tournamentConnection?.disconnect();
	tournamentConnection = new TournamentWsConnection();
	connectedTournamentId = tournamentId;

	tournamentConnection.connect(
		tournamentId,
		userId,

		// tournament_update
		(data) => {
			const myId = ctx.userStore.get()?.id;
			if (!myId) return;

			const msg = buildSimpleTournamentMsg(data, myId);
			showTournamentNotifBox(msg);

			// optional: keep state fresh for disabling invites etc.
			refreshIsUserInGameOrTournament(ctx).catch(() => {});
		},

		// opponent_ready
		(data) => {
			showTournamentNotifBox("🟢 Opponent is ready. Go to the tournament page.");
		},

		// start_game
		(data) => {
			showTournamentNotifBox("🎮 Match is starting now. Go to the tournament page.");
		},

		// start_tournament
		() => {
			showTournamentNotifBox("🚀 Tournament started. Go to the tournament page.");
		},

		// tournament_closed
		() => {
			// 1) show notif
			showTournamentNotifBox("🏁 Tournament finished.");

			// 2) disconnect tournament WS + reset ids
			tournamentConnection?.disconnect();
			tournamentConnection = null;
			livechatTournamentId = null;
			connectedTournamentId = null;

			// 3) refresh flags so invite buttons etc. become correct again
			refreshIsUserInGameOrTournament(ctx)
			.then(() => {
				if (_selectedFriend) renderChatBox(_selectedFriend, ctx, selectVersion);
			})
			.catch(() => {});

			// 4) hide the notif box after 5 sec
			window.setTimeout(() => hideTournamentNotifBox(), 2000);
		},
	);

}

export function cleanLiveChatWS() {
	if (chatConnection) {
		chatConnection.disconnect();
		chatConnection = null;
	}
	if (tournamentConnection) {
		tournamentConnection.disconnect();
		tournamentConnection = null;
	}
	livechatTournamentId = null;
	connectedTournamentId = null;
	
	if (wsNewMessageHandler) {
		window.removeEventListener("ws-new-message", wsNewMessageHandler);
		wsNewMessageHandler = null;
	}

	listenersAttached = false;
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
						${escapeHtml(msg.content ?? "")}
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

function bindInviteActionButtons(friendId: string, gameId: string, ctx: AppContext, version:number) {
	const acceptBtn = document.getElementById("accept-invite-btn") as HTMLButtonElement | null;
	const declineBtn = document.getElementById("decline-invite-btn") as HTMLButtonElement | null;

	if (!acceptBtn || !declineBtn || !gameId) return;

	const isStale = () => version !== selectVersion || _selectedFriend?.id !== friendId;
	acceptBtn.onclick = async () => {
		if (isStale()) return;
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
			if (isStale()) return;

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
			router.navigateTo(`/game-room/${encodeURIComponent(gameId)}`);
		} catch (err) {
			console.error("❌ joinGameFromChat error:", err);
			showToast("❌ Failed to join the game.", "block");
			acceptBtn.disabled = false;
			declineBtn.disabled = false;
		}
	};

	declineBtn.onclick = async () => {
		if (isStale()) return; 
		declineBtn.disabled = true;
		acceptBtn.disabled = true;

		try {
			// Step 1: call backend
			const res = await chatApi.declineGameFromChat({ gameId });
			if (isStale()) return; 

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
				inviteBtn.textContent = "🎮 Invite Game";
				inviteBtn.disabled = true;
				inviteBtn.onclick = null;
			}

			showToast("Invite declined", "block");

			if (_selectedFriend) {
				await refreshIsUserInGameOrTournament(ctx);
				renderChatBox(_selectedFriend, ctx, selectVersion);
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
	const cached = pendingInviteMap.get(friendId) ?? null;

	try {
		const res = await chatApi.getPendingInvite(friendId);

		// if not ok -> clear stale state
		if (!res || res.status !== "ok") {
			return cached;
		}

		const gameId = (res.gameId && res.gameId.trim() !== "") ? res.gameId : null;

		if (gameId) 
			pendingInviteMap.set(friendId, gameId);
		else 
			pendingInviteMap.delete(friendId);

		return gameId;
	} catch (err) {
		console.error("❌ syncPendingInviteFromBackend error:", err);
		return cached;
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

function showTournamentNotifBox(text: string) {
	const box = document.getElementById("tournament-notif");
	const textEl = document.getElementById("tournament-notif-text");

	if (!box || !textEl) return;

	box.classList.remove("hidden");
	textEl.textContent = text;
}


function hideTournamentNotifBox() {
	const box = document.getElementById("tournament-notif");
	const textEl = document.getElementById("tournament-notif-text");
	if (!box) return;
	box.classList.add("hidden");
	if (textEl) textEl.textContent = "";
}


function isMeInGame(game: any, myId: string): boolean {
	const arr = game?.gameUsers;
	if (!Array.isArray(arr)) return false;
	return arr.some((gu) => gu?.userId === myId);
}

function buildSimpleTournamentMsg(data: any, myId: string): string {
	const inCurrent = isMeInGame(data?.game, myId);
	const inNext = isMeInGame(data?.nextGame, myId);

	if (inNext) return "📣 Upcoming match assigned.";
	if (inCurrent) return "📣 Current match updated.";
	return "📣 Tournament updated.";
}

function patchChatHeader(friend: any) {
	const nameEl = document.getElementById("chat-friend-name");
	const statusEl = document.getElementById("chat-friend-status");
	if (nameEl) nameEl.textContent = friend.displayName ?? "";
	if (statusEl) statusEl.textContent = friend.isOnline ? "Online" : "Offline";
}

function renderChatShell(friend: any) {
	const chatRight = document.getElementById("chat-right");
	const chatEmpty = document.getElementById("chat-empty");
	if (!chatRight || !chatEmpty) return;

	chatEmpty.classList.add("hidden");
	chatRight.classList.remove("hidden");

	chatRight.innerHTML = `
		<div class="flex justify-between items-center p-4 border-b">
			<div>
				<p id="chat-friend-name" class="font-bold text-lg">${escapeHtml(friend.displayName ?? "")}</p>
				<p id="chat-friend-status" class="text-gray-500 text-sm">${friend.isOnline ? "Online" : "Offline"}</p>
			</div>
			<div class="text-sm text-gray-400">Loading…</div>
		</div>

		<div class="flex-1 p-4 overflow-y-auto">
			<p class="text-gray-400 text-center mt-4">Loading messages…</p>
		</div>
	`;
}

async function verifyStillFriend(friendId: string, friendListComponent: any, ctx: AppContext, version: number) {
	try {
		const list = await friendshipApi.getList();
		if (version !== selectVersion) return;

		const fresh = list.find((f: any) => f.id === friendId);
		if (!fresh) {
			// friendship removed / friend deleted you
			_selectedFriend = null;
			document.getElementById("chat-right")?.classList.add("hidden");
			document.getElementById("chat-empty")?.classList.remove("hidden");

			if (friendListComponent?.loadAndRender) {
				friendListComponent.skipAutoSelect = true;
				await friendListComponent.loadAndRender();
			}
			return;
		}

		// update selected friend fields (online/blocked etc.) without re-rendering chat
		if (_selectedFriend?.id === friendId) {
			_selectedFriend = fresh;
			patchChatHeader(fresh);
		}
	} catch (err) {
		console.error("verifyStillFriend failed:", err);
	}
}

// ======== PROTECT sql INJECTIONS / XSS ATTACKS ===========
export function escapeHtml(s: string): string {
	const str = String(s ?? "");
	return str
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}


// ======== GET CURRENT GAME ============
async function getCurrentGame(ctx: AppContext): Promise<{userId: string, gameId: string, type: string, status: string, token: string | null} | null> {
	try {
		const currentGame = await gameService.getCurrentGame(ctx);
		return currentGame;
	} catch(error) {
		// console.log(error);
		return null;
	}
}

// ======== GET CURRENT TOURNAMENT ============
async function getCurrentTournament(): Promise<{userId: string, tournamentId: string, type: string, token: string | null} | null> {
	try {
		const currentTournament = await tournamentApi.getCurrentTournament();
		return currentTournament;
	} catch(error) {
		// console.log(error);
		return null;
	}
}
