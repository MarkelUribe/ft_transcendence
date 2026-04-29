<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { FriendsAPI } from '$lib/api/friends';
  import { initChatSocket, sendMessage, getConversation, disconnectChat } from '$lib/api/chat';
  import { browser } from '$app/environment';

  const BACKEND_URL = 'https://localhost:3000';

  let { compact = true } = $props();
  let messagesContainer = $state();
  
  let friends: any[] = $state([]);
  let selectedFriend: any = $state(null);
  let messages: any[] = $state([]);
  let newMessage = $state('');
  let loading = $state(false);
  let error = $state('');

  let currentUserId: number | null = null;

  function handleNewMessageNotification(senderId) {
    if (!selectedFriend || selectedFriend.id !== senderId) {
      unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
    }

    const friendIndex = friends.findIndex(f => f.id === senderId);
    if (friendIndex > -1) {
      const friendData = friends[friendIndex];
      friends.splice(friendIndex, 1);
      friends.unshift(friendData);
    }
  }

  function onSelectFriend(friend) {
    unreadCounts[friend.id] = 0;
    selectFriend(friend); // Tu función original
  }

  function getAvatarUrl(avatarUrl: string | null): string {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${BACKEND_URL}${avatarUrl}`;
  }

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

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  $effect(() => {
    const _trigger = messages; 
    const _friend = selectedFriend;

    if (selectedFriend && messagesContainer) {
      setTimeout(scrollToBottom, 50);
    }
  });
</script>

<div class="chat-box" class:compact>
    <div class="chat-container">
        
        {#if !selectedFriend}
            <!-- VISTA A: LISTA DE AMIGOS -->
            <aside class="friends-list full-width">
                <h2>Friends</h2>
                {#if friends.length === 0}
                    <p class="empty">No tienes amigos aún</p>
                {:else}
                    <ul>
                        {#each friends as friend}
                            <li>
                                <button type="button" class="friend-item-btn" onclick={() => selectFriend(friend)}>
                                    <div class="avatar">
                                        {#if friend.avatarUrl}
                                            <img src={getAvatarUrl(friend.avatarUrl)} alt={friend.username} class="avatar-img" />
                                        {:else}
                                            {friend.username?.charAt(0).toUpperCase() || '?'}
                                        {/if}
                                    </div>
                                    <span class="username">{friend.username}</span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </aside>
        {:else}
            <!-- VISTA B: CHAT INDIVIDUAL -->
            <main class="chat-area full-width">
                <header class="chat-header">
                    <!-- BOTÓN VOLVER -->
                    <button class="back-btn" onclick={() => selectedFriend = null}>
                        ←
                    </button>
                    <div class="avatar">
                        {#if selectedFriend.avatarUrl}
                            <img src={getAvatarUrl(selectedFriend.avatarUrl)} alt={selectedFriend.username} class="avatar-img" />
                        {:else}
                            {selectedFriend.username?.charAt(0).toUpperCase() || '?'}
                        {/if}
                    </div>
                    <span>{selectedFriend.username}</span>
                </header>

                <div class="messages" bind:this={messagesContainer}>
                    {#if loading}
                        <p class="loading">Cargando mensajes...</p>
                    {:else if messages.length === 0}
                        <p class="empty">No hay mensajes aún</p>
                    {:else}
                        {#each messages as msg}
                            <div class="message" class:own={msg.senderId === currentUserId}>
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
            </main>
        {/if}

    </div>
</div>

<style>
    .chat-box.compact {
    width: 300px;
    height: 450px;
    position: fixed;
    bottom: 80px;
    right: 100px;
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
  }
  
  .chat-container {
        display: block; /* Cambiamos de flex a block o quitamos el row */
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

  .friends-list {
    width: 280px;
    border-right: 1px solid #333;
    padding: 1rem;
    overflow-y: auto;
  }

  .friends-list h2 {
    text-align: center;
    margin: 0 0 1rem;
    font-size: 1rem;
    color: #000000;
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
    background: rgba(0, 0, 0, 0.05); /* Un gris muy, muy suave */
    border-radius: 4px; /* Opcional: bordes un poco redondeados */
    transition: background 0.3s ease; /* Para que el cambio no sea de golpe */
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
    overflow: hidden;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .username {
    font-size: 0.85rem;
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

  .chat-header span {
    font-size: 0.85rem; /* Tamaño de texto pequeño y elegante */
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
    font-size: 0.85rem;
    line-height: 1.2;
  }

  .message .sender-name {
    font-size: 0.7rem;
    color: #9ca3af;
    display: block;
    margin-bottom: 0.25rem;
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
    padding: 1rem;
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