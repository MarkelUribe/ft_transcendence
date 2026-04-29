<script lang="ts">

    import { onMount, onDestroy } from 'svelte';
    import { io } from 'socket.io-client';


	export let gameId: string | null = null;
	export let friends: any[] = [];
	export let incomingRequests: any[] = [];
	export let outgoingRequests: any[] = [];
	export let myUsername: string = "";

	export let newFriendId: string;
	export let addFriendError = '';
	export let addFriendSuccess = '';
	export let requestsError = '';

    export let token;
    export let friendId;

    let socket;
    let socketChat;
    let privateMessageText = "";
    let messageText = "";
    let messages = [];
    let chatContainer;


	export let handleNewFriend: () => void;
	export let handleAcceptRequest: (id: number) => void;
	export let handleRejectRequest: (id: number) => void;

	// Estado interno
	type SidebarView = 'FRIENDS' | 'MESSAGES';
	let currentView: SidebarView = 'FRIENDS';
	let newMessage = "";

    

    let activePrivateChat: any = null; 
    let myId = 1;
    let privateMessages = [];


	// Cambio automático a chat si empieza una partida
	//$: if (gameId) currentView = 'CHAT';
    $: if (gameId) {
		currentView = 'CHAT';
	} else if (currentView === 'CHAT' && !gameId) {
		currentView = 'FRIENDS';
	}

    function initChatSocket() {
    socketChat = io("https://localhost:3000/chat", {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket']
    });
}


    function backToList() {
        activePrivateChat = null;
    }



    async function loadHistory() {
        try {
            const response = await fetch(`https://localhost:3000/chat/history/${friendId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            messages = await response.json();
            scrollToBottom();
        } catch (err) {
            console.error("Error cargando historial", err);
        }
    }

    // 2. Configurar Socket
   onMount(() => {
        // Inicializamos la conexión al namespace /chat
        socketChat = io("https://localhost:3000/chat", {
            auth: { token: localStorage.getItem('token') },
            transports: ['websocket'],
            forceNew: true
        });

        socketChat.on('privateMessage', (data) => {
            console.log("Mensaje recibido:", data);
            
            // Lógica unificada: añadir si es del chat activo
            if (activePrivateChat && (data.from === activePrivateChat.id || data.from === myUserId)) {
                privateMessages = [...privateMessages, {
                    senderId: data.from,
                    content: data.text,
                    createdAt: data.createdAt
                }];
                scrollToBottom();
            }
        });

        // El return de limpieza debe ir AL FINAL del onMount
        return () => {
            if (socketChat) socketChat.disconnect();
        };
    });


async function openChat(friend) {
        console.log("Abriendo chat con:", friend.username);
        activePrivateChat = friend;
        privateMessages = []; 
        currentView = 'MESSAGES'; // Asegúrate de cambiar la vista

        try {
            const response = await fetch(`https://localhost:3000/chat/history/${friend.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const history = await response.json();
                privateMessages = history.map(m => ({
                    senderId: m.senderId,
                    content: m.content,
                    createdAt: m.createdAt
                }));
                scrollToBottom();
            }
        } catch (err) {
            console.error("Error cargando historial", err);
        }
    }

    function sendPrivateMessage() {
        if (!privateMessageText.trim() || !activePrivateChat) return;

        const payload = {
            toUserId: activePrivateChat.id,
            text: privateMessageText // Coincide con tu NestJS
        };

        socketChat.emit('sendPrivateMessage', payload);
        privateMessageText = ""; 
    }

    function scrollToBottom() {
        setTimeout(() => {
            if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 50);
    }

    
</script>

<div class="sidebar-wrapper">
    <div class="tabs">
        <button 
            class:active={currentView === 'FRIENDS'} 
            on:click={() => (currentView = 'FRIENDS')}
        >
            Friends
        </button>

        <button
            class:active={currentView === 'MESSAGES'}
            on:click={() => currentView = 'MESSAGES'}
        >
			Messages
		</button>
    </div>

	<div class="content">
		{#if currentView === 'FRIENDS'}
			<div class="friends-panel">
				<h2>Your friends</h2>

				<div class="add-friend-form">
					<input
						class="add-friend-input"
						type="text"
						placeholder="Enter friend user ID"
						bind:value={newFriendId}
						on:keydown={(e) => e.key === 'Enter' && handleNewFriend()}
					/>
					<button class="small-button" on:click={handleNewFriend}>Add</button>
				</div>

				{#if addFriendError}
					<p class="friends-message error">{addFriendError}</p>
				{:else if addFriendSuccess}
					<p class="friends-message success">{addFriendSuccess}</p>
				{/if}

				<div class="scrollable-list">
					{#if friends.length === 0}
						<p class="empty-msg">You have no friends added yet.</p>
					{:else}
						{#each friends as friend}
							<div class="friend-item">
								<span>{friend.username}</span>
								<span class="elo">{friend.elo ?? 0} ELO</span>
							</div>
						{/each}
					{/if}

					{#if requestsError}
						<p class="friends-message error">{requestsError}</p>
					{/if}

					<div class="section">
						<div class="request-section-title">Incoming requests</div>
						{#each incomingRequests as req}
							<div class="request-item">
								<span>{req.requester.username}</span>
								<div class="request-actions">
									<button class="request-button-accept" on:click={() => handleAcceptRequest(req.id)}>Accept</button>
									<button class="request-button-reject" on:click={() => handleRejectRequest(req.id)}>Reject</button>
								</div>
							</div>
						{:else}
							<p class="empty-msg">No incoming requests.</p>
						{/each}
					</div>

					<div class="section">
						<div class="request-section-title">Outgoing requests</div>
						{#each outgoingRequests as req}
							<div class="request-item">
								<span>{req.addressee.username}</span>
								<span class="pending-text">Pending</span>
							</div>
						{:else}
							<p class="empty-msg">No outgoing requests.</p>
						{/each}
					</div>
				</div>
			</div>
        {:else if currentView === 'MESSAGES'}
            <div class="private-messaging-panel">
                {#if activePrivateChat}
                    <div class="chat-view">
                        <div class="chat-header">
                            <button class="back-link" on:click={backToList}>← Back</button>
                            <span>Chat with {activePrivateChat.username}</span>
                        </div>
                        <div class="private-messages-list">
                            {#if privateMessages && privateMessages.length > 0}
                                {#each privateMessages as msg}
                                    <div class="msg {msg.senderId === myId ? 'sent' : 'received'}">
                                        <div class="msg-bubble">
                                            {msg.content}
                                        </div>
                                        <span class="msg-time">
                                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                {/each}
                            {:else}
                            <p class="empty-msg">No messages yet. Say hello!</p>
                        {/if}
                    </div>
                        <div class="chat-input-area">
                            <input 
                                bind:value={privateMessageText} 
                                placeholder="Type a message..." 
                                on:keydown={(e) => e.key === 'Enter' && sendPrivateMessage()}
                            />
                            <button on:click={sendPrivateMessage}>Send</button>
                        </div>
                    </div>
                {:else}
                    <h2>Chat with friends</h2>
                    <div class="scrollable-list">
                        {#each friends as friend}
                            <div class="friend-item-chat" on:click={() => openChat(friend)}>
                                <div class="friend-info">
                                    <span class="status-dot"></span>
                                    <span>{friend.username}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
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