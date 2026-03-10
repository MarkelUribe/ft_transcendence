<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { io, type Socket } from 'socket.io-client';
	import { FriendsAPI } from '$lib/api/friends';

	let username = '';
	let isLoggedIn = false;
	let socket: Socket | null = null;
	let status = 'Not searching';
	let searching = false;
	let playerId: string | null = null;

  let friends: { id: number; username: string; avatarUrl: string | null; elo: number | null }[] = [];

  // NEW: state for add-friend UI
  let newFriendId = '';
  let addFriendError = '';
  let addFriendSuccess = '';
  let friendsApi: FriendsAPI | null = null;

  // NEW: state for pending friend requests
  type FriendUser = { id: number; username: string; avatarUrl: string | null; elo: number | null };
  type FriendshipRequest = {
    id: number;
    requester: FriendUser;
    addressee: FriendUser;
    status: string;
  };

  let incomingRequests: FriendshipRequest[] = [];
  let outgoingRequests: FriendshipRequest[] = [];
  let requestsError = '';

	onMount(() => {
		if (!browser) return;

		const token = localStorage.getItem('token');
		const storedUsername = localStorage.getItem('username');
		playerId = localStorage.getItem('id');

		if (token && storedUsername) {
			isLoggedIn = true;
			username = storedUsername;
		}

		friendsApi = new FriendsAPI(token);
		refreshFriendsAndRequests();
	});

async function startMatchmaking() {
	if (!playerId) {
		status = 'No player ID found';
		return;
	}

	searching = true;
	status = 'Checking for existing game...';

	try {
		const res = await fetch(`http://localhost:3000/game/player/${playerId}`);

		if (res.ok) {
			const game = await res.json();

			if (game && game.gameId) {
				goto(`/game/${game.gameId}`);
				return;
			}
		}
	} catch (err) {
		console.error(err);
	}

	// No active game → start matchmaking
	status = 'Connecting...';

	const newSocket = io('http://localhost:3000');
	socket = newSocket;

	newSocket.on('connect', () => {
		status = 'Searching for opponent...';
		newSocket.emit('joinQueue', { playerId });
	});

	newSocket.on('waiting', () => {
		status = 'Waiting for opponent...';
	});

	newSocket.on('matched', (data: { gameId: string }) => {
		searching = false;
		goto(`/game/${data.gameId}`);
	});

	newSocket.on('disconnect', () => {
		status = 'Disconnected...';
		searching = false;
	});
}

	function cancelMatchmaking() {
		if (!socket) return;
		socket.emit('leaveQueue');
		socket.disconnect();
		socket = null;
		status = 'Matchmaking canceled';
		searching = false;
	}

	function handleButtonClick() {
		if (searching) cancelMatchmaking();
		else startMatchmaking();
	}

	async function refreshFriendsAndRequests() {
		if (!friendsApi) return;

		requestsError = '';

		try {
		const [friendsData, pending] = await Promise.all([
			friendsApi.getFriends(),
			friendsApi.getPendingRequests(),
		]);
		friends = friendsData ?? [];
		incomingRequests = pending?.incoming ?? [];
		outgoingRequests = pending?.outgoing ?? [];
		} catch (err) {
		console.error('Failed to load friends or requests', err);
		requestsError = 'Could not load friend requests.';
		}
	}

  function handlePlay() {
    goto('/game');
  }

	function handleLogin() {
		goto('/login');
	}

	  function handlePlayBot() {
    goto('/match_making/bot');
  }

  // REPLACED: handleNewFriend now actually sends a request
  async function handleNewFriend() {
    if (!friendsApi || !newFriendId.trim()) return;

    addFriendError = '';
    addFriendSuccess = '';

    const id = Number(newFriendId);
    if (Number.isNaN(id)) {
      addFriendError = 'Friend ID must be a number.';
      return;
    }

    try {
      await friendsApi.sendFriendRequest(id);
      addFriendSuccess = 'Friend request sent!';
      newFriendId = '';
      await refreshFriendsAndRequests();
    } catch (err) {
      console.error('Failed to send friend request', err);
      if (err instanceof Error && err.message) {
        addFriendError = err.message;
      } else {
        addFriendError = 'Could not send friend request.';
      }
    }
  }

  async function handleAcceptRequest(requestId: number) {
    if (!friendsApi) return;
    try {
      await friendsApi.acceptFriendRequest(requestId);
      await refreshFriendsAndRequests();
    } catch (err) {
      console.error('Failed to accept friend request', err);
      requestsError = err instanceof Error && err.message
        ? err.message
        : 'Could not accept friend request.';
    }
  }

  async function handleRejectRequest(requestId: number) {
    if (!friendsApi) return;
    try {
      await friendsApi.rejectFriendRequest(requestId);
      await refreshFriendsAndRequests();
    } catch (err) {
      console.error('Failed to reject friend request', err);
      requestsError = err instanceof Error && err.message
        ? err.message
        : 'Could not reject friend request.';
    }
  }

	function handleLogout() {
		if (!browser) return;

		localStorage.removeItem('token'); 
		localStorage.removeItem('id');
		localStorage.removeItem('username');
		isLoggedIn = false;
		username = '';

		window.dispatchEvent(new CustomEvent('auth-changed', { detail: { status: 'loggedOut' } }));
	}
</script>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #1e3c72, #2a5298);
		color: #fff;
		overflow: hidden;
	}

	.container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		text-align: center;
		position: relative;
		z-index: 1;
	}

	h1 {
		font-size: 4rem;
		margin-bottom: 1rem;
		text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
	}

	p {
		font-size: 1.2rem;
		margin-bottom: 2rem;
		max-width: 600px;
	}

	.buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.button {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		color: white;
	}

	.button:hover {
		transform: translateY(-3px) scale(1.05);
		box-shadow: 0 6px 20px rgba(0,0,0,0.4);
	}

	.button.searching {
		background: linear-gradient(90deg, #ff512f, #dd2476);
		animation: pulse 1.2s infinite;
	}

	.button.idle {
		background: linear-gradient(90deg, #24c6dc, #514a9d);
	}

	@keyframes pulse {
		0% { transform: scale(1); box-shadow: 0 0 10px rgba(255,255,255,0.5); }
		50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,255,255,0.8); }
		100% { transform: scale(1); box-shadow: 0 0 10px rgba(255,255,255,0.5); }
	}

	.status {
		font-weight: bold;
		font-family: monospace;
		font-size: 1rem;
		margin-top: 1rem;
		text-align: center;
	}

	/* Floating chess pieces */
	.floating-piece {
		position: absolute;
		font-size: 3rem;
		animation: float 6s ease-in-out infinite;
		opacity: 0.3;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(15deg); }
	}

  .friends-panel {
    margin-top: 2rem;
    background: rgba(0, 0, 0, 0.25);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    max-width: 400px;
  }

  .friends-panel h2 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.4rem;
  }

  /* NEW: add-friend styling */
  .add-friend-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .add-friend-input {
    flex: 1;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(0, 0, 0, 0.3);
    color: #fff;
  }

  .add-friend-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

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
    transform: translateY(-1px);
  }

  .friends-message {
    font-size: 0.85rem;
    margin: 0.2rem 0;
  }

  .friends-message.error {
    color: #ffb3b3;
  }

  .friends-message.success {
    color: #b3ffcb;
  }

  .friend-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.95rem;
  }

  .friend-item:last-child {
    border-bottom: none;
  }

  .request-section-title {
    margin-top: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .request-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.9rem;
  }

  .request-item:last-child {
    border-bottom: none;
  }

  .request-actions {
    display: flex;
    gap: 0.25rem;
  }

  .request-button-accept,
  .request-button-reject {
    padding: 0.25rem 0.6rem;
    font-size: 0.8rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    color: #fff;
  }

  .request-button-accept {
    background: linear-gradient(135deg, #4caf50, #8bc34a);
  }

  .request-button-reject {
    background: linear-gradient(135deg, #f44336, #e91e63);
  }

  .button:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  }

	.button.searching {
		background: linear-gradient(90deg, #ff512f, #dd2476);
		animation: pulse 1.2s infinite;
	}

	.button.idle {
		background: linear-gradient(90deg, #24c6dc, #514a9d);
	}

	@keyframes pulse {
		0% { transform: scale(1); box-shadow: 0 0 10px rgba(255,255,255,0.5); }
		50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,255,255,0.8); }
		100% { transform: scale(1); box-shadow: 0 0 10px rgba(255,255,255,0.5); }
	}

	.status {
		font-weight: bold;
		font-family: monospace;
		font-size: 1rem;
		margin-top: 1rem;
		text-align: center;
	}

	/* Floating chess pieces */
	.floating-piece {
		position: absolute;
		font-size: 3rem;
		animation: float 6s ease-in-out infinite;
		opacity: 0.3;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(15deg); }
	}
</style>

<div class="container">
  <h1>Welcome to Chess Arena</h1>
  <p>
    {#if isLoggedIn}
      Hello, {username}! Ready to play?
    {:else}
      Play chess, review your game logs, and improve your strategy. Choose what you want to do below:
    {/if}
  </p>
  <div class="buttons">
    {#if isLoggedIn}
      <button
				class="button {searching ? 'searching' : 'idle'}"
				on:click={handleButtonClick}>
				{searching ? 'Searching... (Click to cancel)' : 'Play'}
	  </button>
      <button class="button" on:click={handlePlayBot}>Play Against Bot</button>
      <button class="button" on:click={handleLogout}>Logout</button>
    {:else}
      <button class="button" on:click={handleLogin}>Login</button>
    {/if}
  </div>

  {#if isLoggedIn}
    <div class="friends-panel">
      <h2>Your friends</h2>

      <!-- NEW: add-friend inline form -->
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

      {#if friends.length === 0}
        <p>You have no friends added yet.</p>
      {:else}
        {#each friends as friend}
          <div class="friend-item">
            <span>{friend.username}</span>
            <span>{friend.elo ?? 0} ELO</span>
          </div>
        {/each}
      {/if}

      {#if requestsError}
        <p class="friends-message error" style="margin-top: 0.5rem;">{requestsError}</p>
      {/if}

      <div style="margin-top: 0.75rem;">
        <div class="request-section-title">Incoming requests</div>
        {#if incomingRequests.length === 0}
          <p class="friends-message" style="opacity: 0.8;">No incoming requests.</p>
        {:else}
          {#each incomingRequests as req}
            <div class="request-item">
              <span>{req.requester.username}</span>
              <div class="request-actions">
                <button
                  class="request-button-accept"
                  on:click={() => handleAcceptRequest(req.id)}
                >
                  Accept
                </button>
                <button
                  class="request-button-reject"
                  on:click={() => handleRejectRequest(req.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div style="margin-top: 0.5rem;">
        <div class="request-section-title">Outgoing requests</div>
        {#if outgoingRequests.length === 0}
          <p class="friends-message" style="opacity: 0.8;">No outgoing requests.</p>
        {:else}
          {#each outgoingRequests as req}
            <div class="request-item">
              <span>{req.addressee.username}</span>
              <span style="font-size: 0.8rem; opacity: 0.8;">Pending</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Floating chess pieces -->
<span class="floating-piece" style="top: 10%; left: 20%;">♞</span>
<span class="floating-piece" style="top: 40%; left: 80%; animation-delay: 2s;">♜</span>
<span class="floating-piece" style="top: 70%; left: 30%; animation-delay: 4s;">♚</span>
<span class="floating-piece" style="top: 20%; left: 60%; animation-delay: 1s;">♛</span>