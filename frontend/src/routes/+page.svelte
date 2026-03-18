<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { io, type Socket } from "socket.io-client";
	import { FriendsAPI } from "$lib/api/friends";
	import { ChessAPI } from "$lib/api/chess";
	import FriendsPanel from "$lib/FriendsPanel.svelte";
	import InviteModal from "$lib/InviteModal.svelte";
	import FloatingPieces from "$lib/FloatingPieces.svelte";

  let username = "";
  let isLoggedIn = false;
  let socket: Socket | null = null; // matchmaking socket
  let friendsSocket: Socket | null = null; // realtime friends updates
  let status = "Not searching";
  let searching = false;
  let playerId: string | null = null;

  let friends: {
	id: number;
	username: string;
	avatarUrl: string | null;
	elo: number | null;
  }[] = [];

	// NEW: state for add-friend UI
	let addFriendError = "";
	let addFriendSuccess = "";
  let friendsApi: FriendsAPI | null = null;
  let chessApi: ChessAPI | null = null;

  // NEW: state for pending friend requests
  type FriendUser = {
	id: number;
	username: string;
	avatarUrl: string | null;
	elo: number | null;
  };
  type FriendshipRequest = {
	id: number;
	requester: FriendUser;
	addressee: FriendUser;
	status: string;
  };

  let incomingRequests: FriendshipRequest[] = [];
  let outgoingRequests: FriendshipRequest[] = [];
  let requestsError = "";

  type FriendInvite = { fromUserId: number; fromUsername?: string };
  let incomingInvite: FriendInvite | null = null;

  onMount(() => {
	if (!browser) return;

	const token = localStorage.getItem("token");
	const storedUsername = localStorage.getItem("username");
	playerId = localStorage.getItem("id");

	if (token && storedUsername) {
	  isLoggedIn = true;
	  username = storedUsername;
	}

	friendsApi = new FriendsAPI(token);
	chessApi = token ? new ChessAPI(token) : null;
	refreshFriendsAndRequests();

	// establish a socket connection for realtime friends updates
	if (token && playerId) {
	  friendsSocket = io("https://localhost:3000");
	  friendsSocket.on("connect", () => {
		const uid = Number(playerId);
		if (!Number.isNaN(uid)) {
		  friendsSocket?.emit("friends_register", { userId: uid });
		}
	  });

	  friendsSocket.on("friendsUpdated", () => {
		refreshFriendsAndRequests();
	  });

	  friendsSocket.on(
		"friendInvite",
		(data: { fromUserId?: number; fromUsername?: string }) => {
		  const { fromUserId, fromUsername } = data || {};
		  if (!fromUserId) return;
		  incomingInvite = { fromUserId, fromUsername };
		},
	  );

	  friendsSocket.on("friendInviteAccepted", (data: { gameId?: string }) => {
		if (!data?.gameId) return;
		goto(`/game/${data.gameId}`);
	  });
	}
  });

  onDestroy(() => {
	if (friendsSocket) {
	  friendsSocket.disconnect();
	  friendsSocket = null;
	}
  });

  async function startMatchmaking() {
	if (!playerId) {
	  status = "No player ID found";
	  return;
	}

	searching = true;
	status = "Checking for existing game...";

	try {
	  const res = await fetch(`https://localhost:3000/game/player/${playerId}`);

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
	status = "Connecting...";

	const newSocket = io("https://localhost:3000");
	socket = newSocket;

	newSocket.on("connect", () => {
	  status = "Searching for opponent...";
	  newSocket.emit("joinQueue", { playerId });
	});

	newSocket.on("waiting", () => {
	  status = "Waiting for opponent...";
	});

	newSocket.on("matched", (data: { gameId: string }) => {
	  searching = false;
	  goto(`/game/${data.gameId}`);
	});

	newSocket.on("disconnect", () => {
	  status = "Disconnected...";
	  searching = false;
	});
  }

  function cancelMatchmaking() {
	if (!socket) return;
	socket.emit("leaveQueue");
	socket.disconnect();
	socket = null;
	status = "Matchmaking canceled";
	searching = false;
  }

  function handleButtonClick() {
	if (searching) cancelMatchmaking();
	else startMatchmaking();
  }

  async function refreshFriendsAndRequests() {
	if (!friendsApi) return;

	requestsError = "";

	try {
	  const [friendsData, pending] = await Promise.all([
		friendsApi.getFriends(),
		friendsApi.getPendingRequests(),
	  ]);
	  friends = friendsData ?? [];
	  incomingRequests = pending?.incoming ?? [];
	  outgoingRequests = pending?.outgoing ?? [];
	} catch (err) {
	  console.error("Failed to load friends or requests", err);
	  requestsError = "Could not load friend requests.";
	}
  }

  function handleLogin() {
	goto("/login");
  }

  function handlePlayBot() {
	goto("/match_making/bot");
  }

  // REPLACED: handleNewFriend now actually sends a request
  async function handleNewFriend(friendIdInput: string) {
	if (!friendsApi) return;

	addFriendError = "";
	addFriendSuccess = "";

	const id = Number(friendIdInput);
	if (Number.isNaN(id)) {
	  addFriendError = "Friend ID must be a number.";
	  return;
	}

	try {
	  await friendsApi.sendFriendRequest(id);
	  addFriendSuccess = "Friend request sent!";
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

  async function acceptInvite() {
	if (!incomingInvite || !chessApi || !playerId || !friendsSocket) return;

	const fromUserId = incomingInvite.fromUserId;
	incomingInvite = null;

	try {
	  const whiteId = String(fromUserId);
	  const blackId = playerId;
	  const game = await chessApi.createGame(whiteId, blackId);

	  if (game && game.id) {
		friendsSocket.emit("friend_invite_accepted", {
		  inviterId: fromUserId,
		  inviteeId: Number(playerId),
		  gameId: game.id,
		});
		goto(`/game/${game.id}`);
	  }
	} catch (err) {
	  console.error("Failed to accept friend invite", err);
	}
  }

  function declineInvite() {
	incomingInvite = null;
  }

  async function handleInvite(friendId: number) {
	if (!friendsSocket || !playerId) return;
	const fromUserId = Number(playerId);
	if (Number.isNaN(fromUserId)) return;

	friendsSocket.emit("friend_invite", {
	  fromUserId,
	  toUserId: friendId,
	  fromUsername: username,
	});
  }

  function handleLogout() {
	if (!browser) return;

	localStorage.removeItem("token");
	localStorage.removeItem("id");
	localStorage.removeItem("username");
	isLoggedIn = false;
	username = "";

	window.dispatchEvent(
	  new CustomEvent("auth-changed", { detail: { status: "loggedOut" } }),
	);
  }
</script>

<div class="container">
  <h1>Welcome to Chess Arena</h1>
  <p>
	{#if isLoggedIn}
	  Hello, {username}! Ready to play?
	{:else}
	  Play chess, review your game logs, and improve your strategy. Choose what
	  you want to do below:
	{/if}
  </p>
  <div class="main-layout">
	<div class="left-column">
	  <div class="buttons {isLoggedIn ? 'buttons-logged-in' : 'buttons-logged-out'}">
		{#if isLoggedIn}
		  <button
			class="button {searching ? 'searching' : 'idle'}"
			on:click={handleButtonClick}
		  >
			{searching ? "Searching... (Click to cancel)" : "Play"}
		  </button>
		  <button class="button idle" on:click={handlePlayBot}
			>Play Against Bot</button
		  >
		  <button class="button idle" on:click={handleLogout}>Logout</button>
		{:else}
		  <button class="button idle" on:click={handleLogin}>Login</button>
		{/if}
	  </div>
	</div>

	{#if isLoggedIn}
	  <div class="right-column">
		<FriendsPanel
		  {friends}
		  {incomingRequests}
		  {outgoingRequests}
		  {requestsError}
		  {addFriendError}
		  {addFriendSuccess}
		  on:addFriend={(e) => handleNewFriend(e.detail)}
		  on:inviteFriend={(e) => handleInvite(e.detail)}
		  on:acceptRequest={(e) => handleAcceptRequest(e.detail)}
		  on:rejectRequest={(e) => handleRejectRequest(e.detail)}
		/>
	  </div>
	{/if}
  </div>
</div>

<InviteModal
	open={!!incomingInvite}
	fromUsername={incomingInvite?.fromUsername ?? null}
	on:accept={acceptInvite}
	on:decline={declineInvite}
/>

<FloatingPieces />

<style>
  :global(body) {
	margin: 0;
	font-family: "Segoe UI", Roboto, sans-serif;
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

  .main-layout {
	display: flex;
	flex-direction: column;
	gap: 2rem;
	width: 100%;
	max-width: 900px;
	margin-top: 1rem;
  }

  .left-column,
  .right-column {
	flex: 1;
  }

  h1 {
	font-size: 4rem;
	margin-bottom: 1rem;
	text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
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
	width: 70%;
  }

  .button:hover {
	transform: translateY(-3px) scale(1.05);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }

  .button.searching {
	background: linear-gradient(90deg, #ff512f, #dd2476);
	animation: pulse 1.2s infinite;
  }

  .button.idle {
	background: linear-gradient(90deg, #24c6dc, #514a9d);
  }

  @keyframes pulse {
	0% {
	  transform: scale(1);
	  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}
	50% {
	  transform: scale(1.05);
	  box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
	}
	100% {
	  transform: scale(1);
	  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}
  }

  @media (min-width: 768px) {
	.container {
	  text-align: left;
	}

	.main-layout {
	  flex-direction: row;
	  align-items: flex-start;
	  justify-content: center;
	}

	.buttons-logged-in {
	  align-items: flex-start;
	}
  }
</style>
