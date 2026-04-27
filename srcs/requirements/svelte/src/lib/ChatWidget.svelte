<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { FriendsAPI } from '$lib/api/friends';
  import { initChatSocket, sendMessage, getConversation, disconnectChat } from '$lib/api/chat';

  let friends: any[] = $state([]);
  let selectedFriend: any = $state(null);
  let messages: any[] = $state([]);
  let newMessage = $state('');
  let loading = $state(false);
  let error = $state('');
  let sidebarOpen = $state(false);

  let currentUserId: number | null = null;
  let unreadCounts: Record<number, number> = $state({});

  onMount(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.sub;
    } catch {
      return;
    }

    initChatSocket();

    try {
      const api = new FriendsAPI(token);
      friends = await api.getFriends();
    } catch (e: any) {
      error = e.message;
    }

    window.addEventListener('chat:newMessage', handleNewMessage);
  });

  onDestroy(() => {
    window.removeEventListener('chat:newMessage', handleNewMessage);
    disconnectChat();
  });

  function handleNewMessage(e: CustomEvent) {
    const message = e.detail;
    const senderId = message.senderId;
    
    if (selectedFriend?.id !== senderId) {
      unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
    }
    
    if (selectedFriend && senderId === selectedFriend.id) {
      messages = [...messages, message];
    }
  }

  async function selectFriend(friend: any) {
    selectedFriend = friend;
    loading = true;
    sidebarOpen = false;
    
    delete unreadCounts[friend.id];

    try {
      const msgs = await getConversation(friend.id);
      messages = msgs;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      sendMessage(selectedFriend.id, newMessage.trim());
      messages = [...messages, {
        senderId: currentUserId,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
      }];
      newMessage = '';
    } catch (e: any) {
      error = e.message;
    }
  }

  function closeChat() {
    selectedFriend = null;
    messages = [];
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
</script>

<!-- Floating Chat Button -->
<button class="chat-fab" onclick={toggleSidebar}>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
  {#if Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0}
    <span class="badge">{Object.values(unreadCounts).reduce((a, b) => a + b, 0)}</span>
  {/if}
</button>

<!-- Sidebar Overlay -->
{#if sidebarOpen}
  <div class="sidebar-overlay" onclick={toggleSidebar}></div>
{/if}

<aside class="chat-sidebar" class:open={sidebarOpen}>
  <header>
    <h2>Chats</h2>
    <button class="close-btn" onclick={toggleSidebar}>×</button>
  </header>
  
  <div class="friends-list">
    {#if friends.length === 0}
      <p class="empty">No tienes amigos aún</p>
    {:else}
      <ul>
        {#each friends as friend}
          <li
            class:active={selectedFriend?.id === friend.id}
            class:has-unread={unreadCounts[friend.id] > 0}
            onclick={() => selectFriend(friend)}
          >
            <div class="avatar">
              {friend.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div class="friend-info">
              <span class="username">{friend.username}</span>
              {#if unreadCounts[friend.id] > 0}
                <span class="unread-badge">{unreadCounts[friend.id]}</span>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</aside>

<!-- Chat Panel -->
{#if selectedFriend}
  <div class="chat-panel">
    <header class="chat-header">
      <button class="back-btn" onclick={closeChat}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"></path>
        </svg>
      </button>
      <div class="avatar">
        {selectedFriend.username?.charAt(0).toUpperCase() || '?'}
      </div>
      <span class="username">{selectedFriend.username}</span>
    </header>

    <div class="messages">
      {#if loading}
        <p class="loading">Cargando mensajes...</p>
      {:else if messages.length === 0}
        <p class="empty">No hay mensajes aún</p>
      {:else}
        {#each messages as msg}
          <div class="message" class:own={msg.senderId === currentUserId}>
            {#if msg.senderId !== currentUserId}
              <span class="sender-name">{msg.sender?.username || 'Usuario'}</span>
            {/if}
            <div class="content">{msg.content}</div>
            <span class="time">{formatTime(msg.createdAt)}</span>
          </div>
        {/each}
      {/if}
    </div>

    <form class="message-input" onsubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
      <input
        type="text"
        bind:value={newMessage}
        placeholder="Escribe un mensaje..."
        disabled={loading}
      />
      <button type="submit" disabled={!newMessage.trim() || loading}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </form>
  </div>
{/if}

{#if error}
  <div class="error-toast">{error}</div>
{/if}

<style>
  /* Floating Action Button */
  .chat-fab {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #2563eb;
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s, background 0.2s;
    z-index: 100;
  }

  .chat-fab:hover {
    transform: scale(1.1);
    background: #1d4ed8;
  }

  .chat-fab .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: #dc2626;
    font-size: 0.75rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Sidebar Overlay */
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 200;
  }

  /* Sidebar */
  .chat-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 320px;
    height: 100vh;
    background: #1a1a1a;
    border-right: 1px solid #333;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 201;
    display: flex;
    flex-direction: column;
  }

  .chat-sidebar.open {
    transform: translateX(0);
  }

  .chat-sidebar header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #333;
  }

  .chat-sidebar h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
  }

  .close-btn:hover {
    color: #fff;
  }

  .friends-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
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
    background: #2a2a2a;
  }

  .friends-list li.active {
    background: #3a3a3a;
  }

  .friends-list li.has-unread {
    background: #2a2a3a;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #4a4a4a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
  }

  .friend-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .username {
    font-size: 0.95rem;
  }

  .unread-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: #2563eb;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Chat Panel */
  .chat-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    background: #1a1a1a;
    border-left: 1px solid #333;
    display: flex;
    flex-direction: column;
    z-index: 150;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #333;
  }

  .back-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
  }

  .back-btn:hover {
    color: #fff;
  }

  .chat-header .username {
    font-weight: 500;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .message {
    max-width: 80%;
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
  }

  .message .sender-name {
    font-size: 0.7rem;
    color: #9ca3af;
    display: block;
    margin-bottom: 0.25rem;
  }

  .message .time {
    font-size: 0.7rem;
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
    padding: 1rem;
    border-top: 1px solid #333;
  }

  .message-input input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #444;
    border-radius: 8px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.95rem;
  }

  .message-input input:focus {
    outline: none;
    border-color: #2563eb;
  }

  .message-input button {
    width: 48px;
    height: 48px;
    border: none;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .message-input button:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .message-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty, .loading {
    color: #888;
    text-align: center;
    padding: 2rem;
  }

  .error-toast {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    padding: 1rem 1.5rem;
    background: #dc2626;
    color: #fff;
    border-radius: 8px;
    z-index: 300;
  }
</style>