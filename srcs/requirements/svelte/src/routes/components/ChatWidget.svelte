<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { FriendsAPI } from '$lib/api/friends';
  import { initChatSocket, sendMessage, getConversation, disconnectChat } from '$lib/api/chat';
  import { browser } from '$app/environment';
  
  let friends: any[] = $state([]);
  let selectedFriend: any = $state(null);
  let messages: any[] = $state([]);
  let newMessage = $state('');
  let loading = $state(false);
  let error = $state('');

  let currentUserId: number | null = null;

  onMount(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      goto('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.sub;
    } catch {
      goto('/login');
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
    // 2. Envuelve el código que usa window
    if (browser) {
      window.removeEventListener('chat:newMessage', handleNewMessage);
      disconnectChat();
    }
  });

  function handleNewMessage(e: CustomEvent) {
    const message = e.detail;
    if (selectedFriend && (message.senderId === selectedFriend.id)) {
      messages = [...messages, message];
    }
  }

  async function selectFriend(friend: any) {
    selectedFriend = friend;
    loading = true;

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

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="chat-box" class:compact>
    <div class="chat-container">
    <aside class="friends-list">
        <h2>Amigos</h2>
        {#if friends.length === 0}
          <p class="empty">No tienes amigos aún</p>
        {:else}
        <ul>
            {#each friends as friend}
           <li
                class:active={selectedFriend?.id === friend.id}
                onclick={() => selectFriend(friend)}
              >
                <div class="avatar">
                  {friend.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <span class="username">{friend.username}</span>
              </li>
            {/each}
          </ul>
        {/if}
    </aside>

    <main class="chat-area">
        {#if !selectedFriend}
          <div class="no-chat">
            <p>Selecciona un amigo para chatear</p>
          </div>
        {:else}
          <header class="chat-header">
            <div class="avatar">
              {selectedFriend.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <span>{selectedFriend.username}</span>
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
              Enviar
            </button>
          </form>
        {/if}
    </main>
    </div>
</div>

{#if error}
  <div class="error-toast">{error}</div>
{/if}

<style>
    .chat-box.compact {
    width: 300px;
    height: 400px;
    position: fixed;
    bottom: 20px;
    right: 20px;
    border: 1px solid #ccc;
    background: white;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }
  
  .messages {
    flex: 1;
    overflow-y: auto;
  }
  .chat-container {
    display: flex;
    height: calc(100vh - 60px);
    max-width: 1200px;
    margin: 0 auto;
  }

  .friends-list {
    width: 280px;
    border-right: 1px solid #333;
    padding: 1rem;
    overflow-y: auto;
  }

  .friends-list h2 {
    margin: 0 0 1rem;
    font-size: 1.25rem;
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

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #4a4a4a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }

  .username {
    font-size: 0.95rem;
  }

  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .no-chat {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #333;
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
  }
</style>