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
  let activeTab = 'friends'; 


    // Tu lógica para cambiar de pestaña
    function openChat(friend) {
        selectedFriend = friend;
        activeTab = 'chat';
    }

</script>

<div class="sidebar-wrapper">
    <nav class="tabs">
        <button class:active={activeTab === 'friends'} on:click={() => activeTab = 'friends'}>
            Amigos
        </button>
        <button class:active={activeTab === 'chat'} on:click={() => activeTab = 'chat'}>
            Chat
        </button>
    </nav>

    <div class="content">
        {#if activeTab === 'friends'}
            <div class="friends-panel">
                <h2>Amigos</h2>
                <div class="add-friend-form">
                    <input type="text" class="add-friend-input" placeholder="Nombre..." />
                    <button>Añadir</button>
                </div>

                <div class="scrollable-list">
                    <div class="friend-item-chat" on:click={() => openChat('Juan')}>
                        <span>Juan</span>
                        <small>Online</small>
                    </div>
                </div>
            </div>
        {:else}
            <div class="chat-view">
                <div class="chat-header">
                    <button class="back-link" on:click={() => activeTab = 'friends'}>←</button>
                    <span>{selectedFriend ? selectedFriend : 'Selecciona un chat'}</span>
                </div>

                <div class="private-messages-list">
                    <p class="empty-msg">No hay mensajes aún.</p>
                </div>

                <div class="chat-input-area">
                    <input type="text" placeholder="Escribe un mensaje..." />
                    <button>Enviar</button>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
	.sidebar-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #fdfdfd;
		color: #333;
	}

	.tabs {
		display: flex;
		background: #eee;
		border-bottom: 1px solid #ccc;
	}

	.tabs button {
		flex: 1;
		padding: 12px;
		border: none;
		background: none;
		cursor: pointer;
		font-weight: bold;
		color: #666;
	}

	.tabs button.active {
		background: white;
		color: #43cea2;
		border-bottom: 3px solid #43cea2;
	}

	.content {
		flex: 1;
		overflow: hidden;
		padding: 15px;
	}

	.scrollable-list {
		max-height: 400px;
		overflow-y: auto;
	}

	.friends-panel h2 { font-size: 1.2rem; margin-bottom: 1rem; }

	.add-friend-form { display: flex; gap: 5px; margin-bottom: 10px; }
	
	.add-friend-input {
		flex: 1;
		padding: 5px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.friend-item, .request-item {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		border-bottom: 1px solid #eee;
	}

	.request-section-title { font-weight: bold; margin-top: 15px; font-size: 0.9rem; }
	.empty-msg { font-size: 0.8rem; color: #999; margin: 5px 0; }
	.error { color: red; font-size: 0.8rem; }
	.success { color: green; font-size: 0.8rem; }

	.request-actions button {
		padding: 2px 8px;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		font-size: 0.8rem;
		color: white;
	}
	.request-button-accept { background: #4caf50; }
	.request-button-reject { background: #f44336; }

    .friend-item-chat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 5px;
        background: #f9f9f9;
        border-radius: 8px;
        cursor: pointer;
    }


    .chat-view {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .chat-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
        margin-bottom: 10px;
    }

    .back-link {
        background: none;
        border: none;
        color: #43cea2;
        cursor: pointer;
        font-weight: bold;
    }

    .private-messages-list {
        flex: 1;
        overflow-y: auto;
        min-height: 300px;
        background: #fff;
        padding: 10px;
    }

    .chat-input-area {
        display: flex;
        gap: 5px;
        padding-top: 10px;
    }

    .chat-input-area input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }


</style>