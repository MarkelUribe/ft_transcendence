<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { FriendsAPI } from "$lib/api/friends";
  import {
    initChatSocket,
    sendMessage,
    getConversation,
    disconnectChat,
    getChatSocket,
    getUnreads,
  } from "$lib/api/chat";
  import { browser } from "$app/environment";
  import type { FriendActivity } from "$lib/Matchmaking";
  import { page } from "$app/stores";
  import { t } from 'svelte-i18n';

  const BACKEND_URL = import.meta.env.VITE_API_URL;


  let messagesContainer = $state();

  let lastMessageTimes = $state<{ [key: number]: string }>({});

  type SidebarView = "FRIENDS" | "MESSAGES";
  
  let currentView = $state("MESSAGES");
  
  let friends: any[] = $state([]);
  let filteredFriends = $derived(
    currentView === "FRIENDS"
      ? [...friends].sort((a, b) => {
          const eloA = Number(a.elo) || 0;
          const eloB = Number(b.elo) || 0;
          return eloB - eloA;
        })
      : [...friends].sort((a, b) => {
          const dateA = new Date(a.last_message_at || 0).getTime();
          const dateB = new Date(b.last_message_at || 0).getTime();
          return dateB - dateA;
        }),
  );

  let {
    compact = true,
    isInGame = false,
    gameMessages = [],
    gameId = null,
    myUsername = "",
    opponentName = "Oponente",
    onSendGameChat,
    showGameChat,
  } = $props();

  let friendsApi: FriendsAPI | null = null;
  let incomingRequests = $state([]);

  let selectedFriend: any = $state(null);
  let messages: any[] = $state([]);
  let newMessage = $state("");
  let loading = $state(false);
  let error = $state("");
  let expandedFriendId = $state<number | null>(null);

  let currentUserId = $state<number | null>(null);

  let unreadChats = $state<Record<string, boolean>>({});

  let hasNewActivity = $state(false);

  let activityById = $state<Record<number, FriendActivity>>({});


  function getAvatarUrl(avatarUrl: string | null): string {
    if (!avatarUrl) return "";
    if (avatarUrl.startsWith("http")) return avatarUrl;
    return `${BACKEND_URL}${avatarUrl}`;
  }

  function onFriendsActivity(e: Event) {
    const rows = (e as CustomEvent).detail as FriendActivity[];
    activityById = Object.fromEntries(rows.map((r) => [r.userId, r]));
  }

onMount(async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    goto("/login");
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    currentUserId = payload.sub;
  } catch {
    goto("/login");
    return;
  }

  const savedTimes = localStorage.getItem(`chat_times_${currentUserId}`);
    if (savedTimes) {
        lastMessageTimes = JSON.parse(savedTimes);
    }

  initChatSocket();

  try {
    unreadChats = await getUnreads();
  } catch (e) {
    console.error("Error cargando unreads", e);
  }

  try {
    friendsApi = new FriendsAPI(token);

    await refreshFriendsAndRequests();
    } catch (e: any) {
      error = e.message;
    }

    window.addEventListener("chat:newMessage", handleNewMessage);
    window.addEventListener("friends:refresh", refreshFriendsAndRequests);
    window.addEventListener(
      "friends:activity",
      onFriendsActivity as EventListener,
    );

    if (gameId) {
      try {
        const res = await fetch(`/api/chat/game/${gameId}/has-unreads`);
        const { hasUnreads } = await res.json();
        
        if (hasUnreads) {
          unreadChats['current-game-chat'] = true; 
        }
      } catch (err) {
        console.error("Error al comprobar notificaciones de partida:", err);
      }
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener("chat:newMessage", handleNewMessage);
      window.removeEventListener("friends:refresh", refreshFriendsAndRequests);
      window.removeEventListener(
        "friends:activity",
        onFriendsActivity as EventListener,
      );
      disconnectChat();
    }
  });

  function handleNewMessage(e: CustomEvent) {
    const message = e.detail;

    const friendId =
      message.senderId === currentUserId
        ? message.receiverId
        : message.senderId;

    const now = new Date().toISOString();

    lastMessageTimes[friendId] = now;

    if (currentView !== "MESSAGES") {
      hasNewActivity = true;
    }

    if (selectedFriend && selectedFriend.id == friendId) {
      messages = [...messages, message];
    } else if (message.senderId !== currentUserId) {
      unreadChats[friendId] = true;
    }

    friends = friends.map((f) => {
      if (f.id == friendId) return { ...f, last_message_at: now };
      return f;
    });
  }

  async function selectFriend(friend: any) {
  try {
    selectedFriend = friend;
    newMessage = "";
    loading = true;

    if (friend.isGame) {
      messages = [];
      return;
    }

    getChatSocket().emit('markConversationRead', { friendId: friend.id });
    unreadChats[friend.id] = false;

    const msgs = await getConversation(friend.id);
    messages = msgs || [];

  } catch (e: any) {
    error = e.message;
  } finally {
    loading = false;
  }
}

  function getDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (msgDate === today) {
      return $t('chat.dates.today');
  } else if (msgDate === yesterday) {
      return $t('chat.dates.yesterday');
  } else {
      return date.toLocaleDateString([], { 
          day: 'numeric', 
          month: 'short',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
  }
}

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedFriend) return;

    if (selectedFriend.isGame) {
      if (onSendGameChat) {
        onSendGameChat(newMessage.trim());
        newMessage = "";
      }
      return;
    }

    const now = new Date().toISOString();

    try {
      sendMessage(selectedFriend.id, newMessage.trim());

      lastMessageTimes[selectedFriend.id] = now;
      lastMessageTimes = { ...lastMessageTimes };

      friends = friends.map((f) => {
        if (f.id === selectedFriend.id) return { ...f, last_message_at: now };
        return f;
      });

      messages = [
        ...messages,
        {
          senderId: currentUserId,
          content: newMessage.trim(),
          createdAt: new Date().toISOString(),
        },
      ];
      newMessage = "";
    } catch (e: any) {
      error = e.message;
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  let newFriendId = $state("");
  let addFriendError = $state("");
  let addFriendSuccess = $state("");
  let requestsError = $state("");

  async function refreshFriendsAndRequests() {
    if (!friendsApi) return;

    requestsError = "";

    try {
      const [friendsData, pending] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingRequests(),
      ]);
      console.log("friendsData:", friendsData);

      friends = (friendsData ?? []).map((f) => ({
        ...f,
        last_message_at: f.last_message_at || lastMessageTimes[f.id] || null,
    }));
      incomingRequests = pending?.incoming ?? [];
    } catch (err) {
      console.error("Failed to load friends or requests", err);
      requestsError = "Could not load friend requests.";
    }
  }

  function onFriendClick(friend: any) {
    if (currentView === "MESSAGES") {
      selectFriend(friend);
      return;
    }
    expandedFriendId = expandedFriendId === friend.id ? null : friend.id;
  }

  async function handleNewFriend() {
    if (!friendsApi || !newFriendId.trim()) return;

    addFriendError = "";
    addFriendSuccess = "";

    const id = Number(newFriendId);
    if (Number.isNaN(id)) {
      addFriendError = "Friend ID must be a number.";
      return;
    }

    try {
      await friendsApi.sendFriendRequest(id);
      addFriendSuccess = "Friend request sent!";
      newFriendId = "";
      await refreshFriendsAndRequests();
    } catch (err) {
      console.error("Failed to send friend request", err);
      if (err instanceof Error && err.message) {
        addFriendError = err.message;
      } else {
        addFriendError = "Could not send friend request.";
      }
    }
  }

  async function handleAcceptRequest(requestId: number) {
    if (!friendsApi) return;
    try {
      await friendsApi.acceptFriendRequest(requestId);
      await refreshFriendsAndRequests();
    } catch (err) {
      console.error("Failed to accept friend request", err);
      requestsError =
        err instanceof Error && err.message
          ? err.message
          : "Could not accept friend request.";
    }
  }

  async function handleRejectRequest(requestId: number) {
    if (!friendsApi) return;
    try {
      await friendsApi.rejectFriendRequest(requestId);
      await refreshFriendsAndRequests();
    } catch (err) {
      console.error("Failed to reject friend request", err);
      requestsError =
        err instanceof Error && err.message
          ? err.message
          : "Could not reject friend request.";
    }
  }

  async function handleRemoveFriend(friendId: number) {
    if (!friendsApi) return;
    try {
      await friendsApi.removeFriend(friendId);
      await refreshFriendsAndRequests();
      if (selectedFriend?.id === friendId) selectedFriend = null;
      if (expandedFriendId === friendId) expandedFriendId = null;
    } catch (err) {
      console.error("Failed to remove friend", err);
    }
  }

  function handleInviteFriend(friendId: number) {
    window.dispatchEvent(
      new CustomEvent("social:invite", { detail: { friendId } }),
    );
  }

  $effect(() => {
    if (currentUserId) {
        localStorage.setItem(`chat_times_${currentUserId}`, JSON.stringify(lastMessageTimes));
    }
  });

  $effect(() => {
    if (!gameMessages || gameMessages.length === 0 || !gameId) {
      return; 
    }

    const hasUnreadMessages = gameMessages.some((msg) => {
      const isReadField = msg.isRead ?? msg.is_read ?? true; 
      return msg.user !== myUsername && isReadField === false;
    });

    const isViewingGameChat = selectedFriend?.id === 'current-game-chat';

    if (hasUnreadMessages) {
      if (!isViewingGameChat) {
        unreadChats['current-game-chat'] = true;
        if (currentView !== 'MESSAGES') {
          hasNewActivity = true;
        }
      } else {
        fetch(`/api/chat/game/${gameId}/read`, { method: 'POST' })
          .catch(err => console.error("Error al marcar como leído:", err));

        unreadChats['current-game-chat'] = false;
      }
    } else if (isViewingGameChat && unreadChats['current-game-chat']) {
      unreadChats['current-game-chat'] = false;
    }
  });

  $effect(() => {
    const _msgNormal = messages;
    const _msgGame = gameMessages;
    const _friend = selectedFriend;

    if (selectedFriend && messagesContainer) {
      setTimeout(scrollToBottom, 50);
    }
  });
</script>

<div class="chat-box" class:compact>
  <div class="chat-container">
    {#if !selectedFriend}
      <aside class="friends-list full-width">
        <div class="sidebar-wrapper">
          <div class="tabs">
            <button
              class:active={currentView === "FRIENDS"}
              onclick={() => (currentView = "FRIENDS")}
            >
              {$t('chat.tabs.friends')}
            </button>

            <button
              class:active={currentView === "MESSAGES"}
              onclick={() => {
                currentView = "MESSAGES";
                hasNewActivity = false;
              }}
            >
              {$t('chat.tabs.messages')}
              {#if hasNewActivity && currentView !== "MESSAGES"}
                <span class="notification-dot"></span>
              {/if}
            </button>
          </div>
        </div>

        <!-- Add friends box -->
        {#if currentView === "FRIENDS"}
          <div class="add-friend-form">
            <input
              class="add-friend-input"
              type="text"
              placeholder="Enter friend user ID"
              bind:value={newFriendId}
              onkeydown={(e) => e.key === "Enter" && handleNewFriend()}
            />
            <button class="small-button" onclick={handleNewFriend}>{$t('chat.buttons.add')}</button>
          </div>
          {#if addFriendError}
            <p class="friends-message error">{addFriendError}</p>
          {:else if addFriendSuccess}
            <p class="friends-message success">{addFriendSuccess}</p>
          {/if}
          {#if requestsError}
            <p class="friends-message error" style="margin-top: 0.5rem;">
              {requestsError}
            </p>
          {/if}

          <div style="  border-bottom: 1px solid #a2a2a2;padding-bottom: 2px;">
            {#if incomingRequests.length != 0}
              <div class="request-section-title">Incoming requests</div>
              {#each incomingRequests as req}
                <div class="request-item">
                  <span>{req.requester.username}</span>
                  <div class="request-actions">
                    <button
                      class="request-button-accept"
                      onclick={() => handleAcceptRequest(req.id)}
                    >
                      {$t('chat.buttons.accept')}
                    </button>
                    <button
                      class="request-button-reject"
                      onclick={() => handleRejectRequest(req.id)}
                    >
                      {$t('chat.buttons.reject')}
                    </button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {/if}

        {#if friends.length === 0 && !isInGame}
          <p class="empty">{$t('chat.status.no_friends')}</p>
        {:else}
          <ul>
            {#if currentView === "MESSAGES" && isInGame && showGameChat}
              <li>
                <button
                  type="button"
                  class="friend-item-btn game-highlight"
                  onclick={() => {
                    selectFriend({
                      id: "current-game-chat",
                      username: opponentName || "Oponente",
                      isGame: true,
                    });
                  }}
                >
                  <div class="avatar game-avatar">🎮</div>
                  <span
                    class="username"
                    class:unread={unreadChats["current-game-chat"]}
                  >
                    <span class="name-text">{$t('chat.status.game_chat')}</span>
                  </span>
                </button>
              </li>
            {/if}

            {#each filteredFriends as friend}
              <li class="friend-li">
                <button
                  type="button"
                  class="friend-item-btn"
                  class:only-view={currentView === "FRIENDS"}
                  onclick={() => onFriendClick(friend)}
                >
                  <div class="friend-left">
                    <div class="avatar">
                      {#if friend.avatarUrl}
                        <img
                          src={getAvatarUrl(friend.avatarUrl)}
                          alt={friend.username}
                          class="avatar-img"
                        />
                      {:else}
                        {friend.username?.charAt(0).toUpperCase() || "?"}
                      {/if}

                      <span
                        class="presence-dot"
                        class:presence-online={!!activityById[friend.id]
                          ?.online || !!activityById[friend.id]?.gameId}
                        class:presence-offline={!activityById[friend.id]
                          ?.online && !activityById[friend.id]?.gameId}
                      ></span>
                    </div>

                    {#if activityById[friend.id]?.gameId}
                      <span class="in-game-text">{$t('chat.status.in_game')}</span>
                    {/if}
                  </div>

                  <span
                    class="username"
                    class:unread={currentView === "MESSAGES" &&
                      unreadChats[friend.id]}
                  >
                    <span class="name-text" title={friend.username}
                      >{friend.username}</span
                    >
                    {#if currentView === "FRIENDS"}
                      <span class="elo-label">{friend.elo || 0}</span>
                    {/if}
                  </span>
                </button>

                {#if currentView === "FRIENDS" && expandedFriendId === friend.id}
                  <div class="friend-actions-row">
                    {#if activityById[friend.id]?.gameId && activityById[friend.id].gameId !== $page.params.gameId}
                      <button
                        type="button"
                        class="small-button action-button"
                        onclick={() =>
                          goto(`/game/${activityById[friend.id].gameId}`)}
                      >
                        {$t('chat.buttons.spectate')}
                      </button>
                    {/if}
                    {#if !activityById[friend.id]?.gameId}
                      <button
                        type="button"
                        class="small-button action-button"
                        onclick={() => handleInviteFriend(friend.id)}
                      >
                        {$t('chat.buttons.invite')}
                      </button>
                    {/if}

                    <button
                      type="button"
                      class="request-button-reject action-button"
                      onclick={() => handleRemoveFriend(friend.id)}
                    >
                      {$t('chat.buttons.remove')}
                    </button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </aside>
    {:else}
      <main class="chat-area full-width">
        <header class="chat-header">
          <button class="back-btn" onclick={() => (selectedFriend = null)}>
            ←
          </button>
          <div class="avatar">
            {#if selectedFriend.isGame}
              <div class="game-avatar-icon">🎮</div>
            {:else if selectedFriend.avatarUrl}
              <img
                src={getAvatarUrl(selectedFriend.avatarUrl)}
                alt={selectedFriend.username}
                class="avatar-img"
              />
            {:else}
              {selectedFriend.username?.charAt(0).toUpperCase() || "?"}
            {/if}
          </div>
          <span>
            {selectedFriend.isGame ? $t('chat.status.game_chat') : selectedFriend.username}
          </span>
        </header>

        <div class="messages" bind:this={messagesContainer}>
          {#if selectedFriend.isGame}
            {#if gameMessages.length === 0}
              <p class="empty">{$t('chat.status.no_game_messages')}</p>
            {:else}
              {#each gameMessages as msg}
                <div class="message" class:own={msg.user === myUsername}>
                  <div class="content">
                    {#if msg.user !== myUsername}
                      <small class="opponent-name">{msg.user}</small>
                    {/if}

                    <p>{msg.text}</p>
                  </div>
                </div>
              {/each}
            {/if}
          {:else if loading}
            <p class="loading">{$t('chat.status.loading_messages')}</p>
          {:else if messages.length === 0}
            <p class="empty">{$t('chat.status.no_messages')}</p>
          {:else}
            {#each messages as msg, i}
              {@const currentDate = new Date(msg.createdAt).toDateString()}
              {@const prevDate = i > 0 ? new Date(messages[i - 1].createdAt).toDateString() : null}

                {#if currentDate !== prevDate}
                  <div class="date-divider">
                    <span>{getDateLabel(msg.createdAt)}</span>
                  </div>
                {/if}
              <div class="message" class:own={msg.senderId === currentUserId}>
                <div class="content">{msg.content}</div>
                <span class="time">{formatTime(msg.createdAt)}</span>
              </div>
            {/each}
          {/if}
        </div>
        {#if !selectedFriend.isGame || onSendGameChat}
          <form
              class="message-input"
              onsubmit={(e) => {
                e.preventDefault();
                if (selectedFriend.isGame ) {
                  if (newMessage.trim()) {
                    onSendGameChat(newMessage);
                    newMessage = "";
                  }
                } else {
                  handleSendMessage();
                }
              }}
            >
            <input
              type="text"
              bind:value={newMessage}
              placeholder={$t('chat.placeholders.write_message')}
              disabled={!selectedFriend.isGame && loading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || (!selectedFriend.isGame && loading)}
            >
              {$t('chat.buttons.send')}
            </button>
          </form>
        {/if}
      </main>
    {/if}
  </div>
</div>

<style>
  .chat-box.compact {
    width: 300px;
    height: 450px;
/*     position: fixed;
    bottom: 80px;
    right: 100px; */
    border: 1px solid #ccc;
    background: white;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .chat-box * {
    box-sizing: border-box;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    max-height: 100%;
    color: white;
  }

  .chat-container {
    display: block;
    width: 100%;
    height: 100%;
  }

  .full-width {
    width: 100% !important;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .friend-item-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
  }

  .friend-item-btn:hover {
    background-color: #f9f9f9;
  }

  .back-btn {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    padding: 5px 10px;
    margin-right: 5px;
  }

  .back-btn:hover {
    color: #007bff;
  }

  .sidebar-wrapper {
    margin-bottom: 10px;
  }

  .tabs {
    display: flex;
    width: 100%;
    border-bottom: 1px solid #ddd;
    margin-bottom: 1rem;
    gap: 5px;
  }

  .tabs button {
    flex: 1;
    padding: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    color: #888888;
    transition: all 0.2s ease-in-out;
    border-bottom: 3px solid transparent;
  }

  .tabs button.active {
    color: #000000;
    border-bottom: 2px solid #000000;
  }

  .tabs button:hover:not(.active) {
    color: #444444;
    background-color: rgba(0, 0, 0, 0.03);
  }

  .notification-dot {
    position: static;
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #00ff00;
    border-radius: 50%;
    box-shadow: 0 0 5px #00ff00;
    margin-top: 1px;
    vertical-align: middle;
    animation: blink 2s infinite;
  }

  @keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 1;
    }
  }

  .elo-label {
    margin-left: auto;
    font-size: 0.95rem;
    font-weight: 600;
    color: #666;
    padding-right: 5px;
    white-space: nowrap;
  }

  .elo-label::after {
    content: " ELO";
    font-size: 0.7rem;
    font-weight: 400;
    color: #888;
    margin-left: 2px;
  }

  .friends-list {
    width: 280px;
    border-right: 1px solid #333;
    padding: 1rem;
    overflow-y: auto;
  }

  .friends-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .friends-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .friends-list li:hover {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    transition: background 0.3s ease;
  }

  .avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #4a4a4a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    overflow: hidden;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .username {
    display: flex;
    align-items: center;
    width: 100%;
    font-size: 0.85rem;
    overflow: hidden;
  }

  .name-text {
    flex: 1; /* Hace que el nombre ocupe todo el espacio disponible */
    white-space: nowrap; /* Evita el salto de línea */
    overflow: hidden; /* Esconde lo que sobra */
    text-overflow: ellipsis; /* Añade los "..." */
    min-width: 0; /* Truco vital para que flexbox permita encoger el texto */
  }

  .opponent-name {
    display: block;
    font-size: 0.7rem;
    font-weight: bold;
    margin-bottom: 2px;
    opacity: 0.8;
  }

  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .chat-header span {
    font-size: 0.85rem;
    font-weight: 600;
    color: #333;
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #f0f0f0;
    background-color: #fff;
    min-height: 40px;
  }

  .message {
    max-width: 70%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: #2a2a2a;
  }

  .message.own {
    align-self: flex-end;
    background: #2563eb;
  }

  .message .content {
    word-break: break-word;
    font-size: 0.85rem;
    line-height: 1.2;
  }

  .message .time {
    font-size: 0.65rem;
    color: #888;
    display: block;
    margin-top: 0.25rem;
  }

  .message.own .time {
    color: #ccc;
  }

  .message-input {
    display: flex;
    gap: 0.5rem;
    border-top: 1px solid #333;
    width: 100%;
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }

  .message-input input {
    flex: 1;
    min-width: 0;
    border: 1px solid #444;
    border-radius: 8px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
  }

  .message-input input:focus {
    outline: none;
    border-color: #2563eb;
  }

  .message-input button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .message-input button:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .message-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty,
  .loading {
    color: #888;
    text-align: center;
    padding: 2rem;
  }

  .unread {
    font-weight: bold;
    color: #000; /* O un color más llamativo para resaltar */
  }

  /* Markel's friend stuff style: */

  /* Add-friend box (dark chat theme) */
  .add-friend-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .add-friend-input {
    flex: 1;
    padding: 0.45rem 0.7rem;
    border-radius: 8px;
    border: 1px solid #a7a7a7;
    background: #e2e2e2;
    color: #2b2b2b;
    font-size: 0.9rem;
  }
  .add-friend-input::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  /* Small action button (match chat send button style) */
  .small-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #43cea2, #185a9d);
    color: #fff;
    transition: all 0.2s ease;
  }
  .small-button:hover {
    transform: translateY(-2px);
  }

  /* Messages for success/error (subtle, on dark bg) */
  .friends-message {
    font-size: 0.85rem;
    margin: 0.25rem 0;
  }
  .friends-message.error {
    color: #ff9b9b;
  }
  .friends-message.success {
    color: #b3f6c8;
  }

  /* Request list headings */
  .request-section-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #454545;
  }

  /* Request item layout */
  .request-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    font-size: 0.9rem;
    color: #414141;
  }

  /* Action buttons for requests */
  .request-actions {
    display: flex;
    gap: 0.4rem;
  }

  .request-button-accept,
  .request-button-reject {
    padding: 0.32rem 0.6rem;
    font-size: 0.82rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    color: #fff;
  }

  /* colors tuned for dark theme */
  .request-button-accept {
    background: linear-gradient(180deg, #2ea64a 0%, #19963a 100%);
    box-shadow: 0 6px 14px rgba(25, 150, 58, 0.12);
  }
  .request-button-accept:hover {
    transform: translateY(-2px);
  }

  .request-button-reject {
    background: linear-gradient(180deg, #e04b4b 0%, #c23131 100%);
    box-shadow: 0 6px 14px rgba(194, 49, 49, 0.12);
  }
  .request-button-reject:hover {
    transform: translateY(-2px);
  }

  .friend-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .avatar {
    position: relative;
  }

  .presence-dot {
    position: absolute;
    right: 2px;
    bottom: 2px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 2px solid #fff;
  }

  .presence-online {
    background-color: #00ff00;
  }

  .presence-offline {
    background-color: #e04b4b;
  }

  .in-game-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }

  .friends-list li.friend-li {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 0;
  }

  .friend-actions-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0 10px 10px 60px;
  }

  .friend-actions-row .action-button {
    padding: 0.32rem 0.7rem;
    font-size: 0.82rem;
    border-radius: 10px;
  }

  .friend-actions-row .small-button {
    background: linear-gradient(180deg, #2563eb, #1d4ed8);
  }

  .friend-actions-row .small-button:hover,
  .friend-actions-row .request-button-reject:hover {
    transform: none;
    filter: brightness(1.05);
  }

    .date-divider {
    display: flex;
    justify-content: center;
    margin: 1.5rem 0;
    width: 100%;
  }

  .date-divider span {
    background-color: #333;
    color: #888;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

</style>
