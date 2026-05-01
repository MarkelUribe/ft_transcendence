<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { FriendsAPI } from '$lib/api/friends';
  import { initChatSocket, sendMessage, getConversation, disconnectChat } from '$lib/api/chat';
  import { browser } from '$app/environment';


  const BACKEND_URL = 'https://localhost:3000';

  let { compact = true } = $props();
  let messagesContainer = $state();

  let lastMessageTimes = $state<{ [key: number]: string }>({});

  type SidebarView = 'FRIENDS' | 'MESSAGES';

  let currentView = $state('MESSAGES');

  let filteredFriends = $derived(
    currentView === 'FRIENDS' 
        ? [...friends].sort((a, b) => {
           
            const eloA = Number(a.elo) || 0;
            const eloB = Number(b.elo) || 0;
            return eloB - eloA; // De mayor a menor
          }) 
        : [...friends].sort((a, b) => {
          const dateA = new Date(a.last_message_at || 0).getTime();
          const dateB = new Date(b.last_message_at || 0).getTime();
          return dateB - dateA;
        })
  );

  //$: if (gameId) {
	//	currentView = 'CHAT';
	//} else if (currentView === 'CHAT' && !gameId) {
	//	currentView = 'FRIENDS';
	//}

  
  
  let friends: any[] = $state([]);
  let selectedFriend: any = $state(null);
  let messages: any[] = $state([]);
  let newMessage = $state('');
  let loading = $state(false);
  let error = $state('');

  let currentUserId = $state<number | null>(null);

  let unreadChats = $state(new Set());

  function moverAmigoAlPrincipio(friendId: number) {
    const index = friends.findIndex(f => f.id == friendId);
    if (index !== -1) {
      const friendToMove = friends[index];
      friends = [friendToMove, ...friends.filter(f => f.id != friendId)];
    }
  }

  function onSelectFriend(friend) {
    unreadCounts[friend.id] = 0;
    selectFriend(friend);
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

    const savedTimes = localStorage.getItem('chat_times');
    if (savedTimes) {
      lastMessageTimes = JSON.parse(savedTimes);
    }

    const savedUnreads = localStorage.getItem('unread_chats');
    if (savedUnreads) {
        unreadChats = new Set(JSON.parse(savedUnreads));
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
      const fetchedFriends = await api.getFriends();

      // 2. FUNDAMENTAL: Inyectar los tiempos en el array de amigos
      friends = fetchedFriends.map(f => ({
        ...f,
        // Si el ID del amigo está en nuestro mapa de tiempos, se lo asignamos
        last_message_at: lastMessageTimes[f.id] || null
      }));
      
      // 3. Forzar a Svelte a ver el cambio de currentUserId
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.sub;
    } catch (e: any) {
      error = e.message;
    }

    window.addEventListener('chat:newMessage', handleNewMessage);
  });

onDestroy(() => {
    if (browser) {
      window.removeEventListener('chat:newMessage', handleNewMessage);
      disconnectChat();
    }
  });

  function handleNewMessage(e: CustomEvent) {
    const message = e.detail;
    
    const friendId = message.senderId === currentUserId ? message.receiverId : message.senderId;

    const now = new Date().toISOString();

    lastMessageTimes[friendId] = now;

    if (selectedFriend && selectedFriend.id == friendId) {
      messages = [...messages, message];
    } else if (message.senderId !== currentUserId) {
      unreadChats.add(friendId);
      unreadChats = new Set(unreadChats);
    }

    friends = friends.map(f => {
      if (f.id == friendId) return { ...f, last_message_at: now };
      return f;
    });
  }

  async function selectFriend(friend: any) {
    selectedFriend = friend;
    loading = true;

    unreadChats.delete(friend.id);
    unreadChats = new Set(unreadChats);

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

    const now = new Date().toISOString();

    try {
      sendMessage(selectedFriend.id, newMessage.trim());

      lastMessageTimes[selectedFriend.id] = now;
      lastMessageTimes = { ...lastMessageTimes }; // Forzar reactividad en el objeto

      // 2. Actualizar el array de amigos (para el $derived visual)
      friends = friends.map(f => {
        if (f.id === selectedFriend.id) return { ...f, last_message_at: now };
        return f;
      });

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
    // Convertimos a JSON para disparar el seguimiento de la propiedad
    const data = JSON.stringify(lastMessageTimes);
    localStorage.setItem('chat_times', data);
  });

  $effect(() => {
    localStorage.setItem('unread_chats', JSON.stringify(Array.from(unreadChats)));
});

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
            <aside class="friends-list full-width">
                <div class="sidebar-wrapper">
                    <div class="tabs">
                        <button 
                            class:active={currentView === 'FRIENDS'} 
                            onclick={() => currentView = 'FRIENDS'}
                        >
                            Friends
                        </button>

                        <button
                            class:active={currentView === 'MESSAGES'}
                            onclick={() => currentView = 'MESSAGES'}
                        >
                            Messages
                        </button>
                    </div>
                </div>
                {#if friends.length === 0}
                    <p class="empty">No tienes amigos aún</p>
                {:else}
                    <ul>
                        {#each filteredFriends as friend}
                            <li>
                                <button type="button" class="friend-item-btn" 
                                  class:only-view={currentView === 'FRIENDS'}
                                  onclick={() => currentView === 'MESSAGES' ? selectFriend(friend) : null}>
                                    <div class="avatar">
                                        {#if friend.avatarUrl}
                                            <img src={getAvatarUrl(friend.avatarUrl)} alt={friend.username} class="avatar-img" />
                                        {:else}
                                            {friend.username?.charAt(0).toUpperCase() || '?'}
                                        {/if}
                                    </div>
                                    <span class="username" class:unread={currentView === 'MESSAGES' && unreadChats.has(friend.id)}>
                                        <span class="name-text">{friend.username}</span>
                                        {#if currentView === 'FRIENDS'}
                                            <span class="elo-label">{friend.elo || 0}</span>
                                        {/if}
                                    </span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </aside>
        {:else}
            <main class="chat-area full-width">
                <header class="chat-header">
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

    .elo-label {
        margin-left: auto;
        font-size: 0.95rem;
        font-weight: 600;
        color: #666;
        padding-right: 5px;
        white-space: nowrap;
    }

    .elo-label::after {
        content: ' ELO';
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
  }

  .name-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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

  .unread {
    font-weight: bold;
    color: #000; /* O un color más llamativo para resaltar */
  }
</style>