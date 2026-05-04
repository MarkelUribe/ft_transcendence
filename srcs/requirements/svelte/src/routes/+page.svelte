<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { io, type Socket } from "socket.io-client";
	import { FriendsAPI } from "$lib/api/friends";
	import { handleButtonClick, searching } from "$lib/Matchmaking";

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

	let username = "";
	let isLoggedIn = false;

	let friends: FriendUser[] = [];

	// state for add-friend UI
	let newFriendId = "";
	let addFriendError = "";
	let addFriendSuccess = "";
	let friendsApi: FriendsAPI | null = null;

	// state for pending friend requests
	let incomingRequests: FriendshipRequest[] = [];
	let outgoingRequests: FriendshipRequest[] = [];
	let requestsError = "";
	let matchInviteMessage = "";
	let incomingMatchInvites: {
		inviteId: string;
		inviterId: number;
		inviterUsername: string;
		createdAt: number;
	}[] = [];
	let activeMatchInvite: {
		inviteId: string;
		inviterId: number;
		inviterUsername: string;
		createdAt: number;
	} | null = null;

	let friendsSocket: Socket | null = null;

	onMount(async () => {
		if (!browser) return;

		
	const isValid = await checkAuth();

	if (!isValid) {
		handleLogout();
		return; // stop execution if not authenticated
	}

		const token = localStorage.getItem("token");
		const storedUsername = localStorage.getItem("username");

		if (token && storedUsername) {
			isLoggedIn = true;
			username = storedUsername;
		}

		if (token) {
			friendsApi = new FriendsAPI(token);
			refreshFriendsAndRequests();

			friendsSocket = io("https://localhost:3000", { auth: { token } });
			friendsSocket.on("friends:requestChanged", () =>
				refreshFriendsAndRequests(),
			);
			friendsSocket.on("friends:friendshipChanged", () =>
				refreshFriendsAndRequests(),
			);
			friendsSocket.on("match:pendingInvites", (invites) => {
				incomingMatchInvites = Array.isArray(invites) ? invites : [];
				if (!activeMatchInvite && incomingMatchInvites.length > 0) {
					activeMatchInvite = incomingMatchInvites[0];
				}
			});
			friendsSocket.on("match:inviteReceived", (invite) => {
				if (!invite?.inviteId) return;
				incomingMatchInvites = [
					invite,
					...incomingMatchInvites.filter(
						(i) => i.inviteId !== invite.inviteId,
					),
				];
				if (!activeMatchInvite) activeMatchInvite = invite;
			});
			friendsSocket.on("match:inviteSent", () => {
				matchInviteMessage = "Invite sent.";
			});
			friendsSocket.on("match:inviteDeclined", () => {
				matchInviteMessage = "Invite declined.";
			});
			friendsSocket.on("match:inviteError", (data) => {
				const message = typeof data === "string" ? data : data?.message;
				requestsError = message || "Match invite failed.";
			});
			friendsSocket.on("matched", (data: { gameId: string }) => {
				if (data?.gameId) goto(`/game/${data.gameId}`);
			});
		} else {
			friendsApi = null;
		}
	});

	onDestroy(() => {
		friendsSocket?.disconnect();
		friendsSocket = null;
		incomingMatchInvites = [];
		activeMatchInvite = null;
	});

	async function checkAuth() {
		const token = localStorage.getItem("token");
		if (!token) return false;

		const res = await fetch("https://localhost:3000/auth/me", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (res.ok) return true;

		localStorage.removeItem("token");
		return false;
	}

	async function refreshFriendsAndRequests() {
		if (!friendsApi) return;

		requestsError = "";

		try {
			const [friendsData, pending] = (await Promise.all([
				friendsApi.getFriends(),
				friendsApi.getPendingRequests(),
			])) as [
				FriendUser[] | null,
				{
					incoming: FriendshipRequest[];
					outgoing: FriendshipRequest[];
				} | null,
			];
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
		} catch (err) {
			console.error("Failed to remove friend", err);
			requestsError =
				err instanceof Error && err.message
					? err.message
					: "Could not remove friend.";
		}
	}

	async function handleInviteFriendMatch(friendId: number) {
		matchInviteMessage = "";
		if (!friendsSocket) {
			requestsError = "Not connected.";
			return;
		}
		friendsSocket.emit("inviteFriend", { friendId });
	}

	function handleAcceptMatchInvite(inviteId: string) {
		if (!friendsSocket) return;
		incomingMatchInvites = incomingMatchInvites.filter(
			(i) => i.inviteId !== inviteId,
		);
		friendsSocket.emit("acceptInvite", { inviteId });
		activeMatchInvite = null;
		if (incomingMatchInvites.length > 0)
			activeMatchInvite = incomingMatchInvites[0];
	}

	function handleRejectMatchInvite(inviteId: string) {
		if (!friendsSocket) return;
		incomingMatchInvites = incomingMatchInvites.filter(
			(i) => i.inviteId !== inviteId,
		);
		friendsSocket.emit("rejectInvite", { inviteId });
		activeMatchInvite = null;
		if (incomingMatchInvites.length > 0)
			activeMatchInvite = incomingMatchInvites[0];
	}

	function handleLogout() {
		if (!browser) return;

		friendsSocket?.disconnect();
		friendsSocket = null;
		incomingMatchInvites = [];
		activeMatchInvite = null;

		localStorage.clear();
		isLoggedIn = false;
		username = "";

		window.dispatchEvent(
			new CustomEvent("auth-changed", {
				detail: { status: "loggedOut" },
			}),
		);
	}
</script>

<div class="container">
	<h1>Welcome to Chess Arena</h1>
	<p>
		{#if isLoggedIn}
			Hello, {username}! Ready to play?
		{:else}
			Play chess, review your game logs, and improve your strategy. Choose
			what you want to do below:
		{/if}
	</p>
	<div class="buttons">
		{#if isLoggedIn}
			<button
				class="button {$searching ? 'searching' : 'idle'}"
				on:click={handleButtonClick}
			>
				{$searching ? "Searching... (Click to cancel)" : "Play"}
			</button>
			<button class="button" on:click={handlePlayBot}
				>Play Against Bot</button
			>
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
					on:keydown={(e) => e.key === "Enter" && handleNewFriend()}
				/>
				<button class="small-button" on:click={handleNewFriend}
					>Add</button
				>
			</div>
			{#if addFriendError}
				<p class="friends-message error">{addFriendError}</p>
			{:else if addFriendSuccess}
				<p class="friends-message success">{addFriendSuccess}</p>
			{/if}
			{#if matchInviteMessage}
				<p class="friends-message success">{matchInviteMessage}</p>
			{/if}

			{#if friends.length === 0}
				<p>You have no friends added yet.</p>
			{:else}
				{#each friends as friend}
					<div class="friend-item">
						<span>{friend.username}</span>
						<span
							style="display: flex; align-items: center; gap: 0.5rem;"
						>
							<span>{friend.elo ?? 0} ELO</span>
							<button
								class="small-button"
								on:click={() =>
									handleInviteFriendMatch(friend.id)}
							>
								Invite
							</button>
							<button
								class="request-button-reject"
								on:click={() => handleRemoveFriend(friend.id)}
							>
								Remove
							</button>
						</span>
					</div>
				{/each}
			{/if}

			{#if requestsError}
				<p class="friends-message error" style="margin-top: 0.5rem;">
					{requestsError}
				</p>
			{/if}

			<div style="margin-top: 0.75rem;">
				<div class="request-section-title">Match invites</div>
				{#if incomingMatchInvites.length === 0}
					<p class="friends-message" style="opacity: 0.8;">
						No match invites.
					</p>
				{:else}
					{#each incomingMatchInvites as inv}
						<div class="request-item">
							<span>{inv.inviterUsername}</span>
							<div class="request-actions">
								<button
									class="request-button-accept"
									on:click={() =>
										handleAcceptMatchInvite(inv.inviteId)}
								>
									Accept
								</button>
								<button
									class="request-button-reject"
									on:click={() =>
										handleRejectMatchInvite(inv.inviteId)}
								>
									Reject
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div style="margin-top: 0.75rem;">
				<div class="request-section-title">Incoming requests</div>
				{#if incomingRequests.length === 0}
					<p class="friends-message" style="opacity: 0.8;">
						No incoming requests.
					</p>
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
					<p class="friends-message" style="opacity: 0.8;">
						No outgoing requests.
					</p>
				{:else}
					{#each outgoingRequests as req}
						<div class="request-item">
							<span>{req.addressee.username}</span>
							<span style="font-size: 0.8rem; opacity: 0.8;"
								>Pending</span
							>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}

	{#if activeMatchInvite}
		{@const inv = activeMatchInvite}
		<div class="confirm-overlay">
			<div class="confirm-box">
				<h2>Match invite</h2>
				<p>{inv.inviterUsername} invited you to play.</p>
				<div class="actions">
					<button
						class="request-button-reject"
						on:click={() => handleRejectMatchInvite(inv.inviteId)}
					>
						Reject
					</button>
					<button
						class="request-button-accept"
						on:click={() => handleAcceptMatchInvite(inv.inviteId)}
					>
						Accept
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
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

	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-20px) rotate(15deg);
		}
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

	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-20px) rotate(15deg);
		}
	}

	/* Match invite popup (same pattern as surrender confirm) */
	.confirm-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.confirm-box {
		background: #1e1e1e;
		color: white;
		padding: 24px;
		border-radius: 12px;
		text-align: center;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
		animation: pop 0.2s ease;
	}

	.confirm-box h2 {
		margin-bottom: 10px;
	}

	.confirm-box p {
		color: #ccc;
		margin-bottom: 20px;
	}

	.actions {
		display: flex;
		gap: 10px;
		justify-content: center;
	}

	@keyframes pop {
		from {
			transform: scale(0.8);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
