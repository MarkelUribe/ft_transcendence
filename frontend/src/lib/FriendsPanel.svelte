<script lang="ts">
  import { createEventDispatcher } from "svelte";

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

  const dispatch = createEventDispatcher();

  export let friends: FriendUser[] = [];
  export let incomingRequests: FriendshipRequest[] = [];
  export let outgoingRequests: FriendshipRequest[] = [];
  export let requestsError = "";
  export let addFriendError = "";
  export let addFriendSuccess = "";

  let newFriendId = "";

  function submitNewFriend() {
    const trimmed = newFriendId.trim();
    if (!trimmed) return;
    dispatch("addFriend", trimmed);
    newFriendId = "";
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitNewFriend();
    }
  }
  
</script>

<div class="friends-panel">
  <h2>Your friends</h2>

  <div class="add-friend-form">
    <input
      class="add-friend-input"
      type="text"
      placeholder="Enter friend user ID"
      bind:value={newFriendId}
      on:keydown={handleKeydown}
    />
    <button class="small-button" on:click={submitNewFriend}>Add</button>
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
        <button
          class="small-button"
          on:click={() => dispatch("inviteFriend", friend.id)}
        >
          Invite
        </button>
      </div>
    {/each}
  {/if}

  {#if requestsError}
    <p class="friends-message error" style="margin-top: 0.5rem;">
      {requestsError}
    </p>
  {/if}

  {#if incomingRequests.length > 0}
    <div style="margin-top: 0.75rem;">
      <div class="request-section-title">Incoming requests</div>
      {#each incomingRequests as req}
        <div class="request-item">
          <span>{req.requester.username}</span>
          <div class="request-actions">
            <button
              class="request-button-accept"
              on:click={() => dispatch("acceptRequest", req.id)}
            >
              Accept
            </button>
            <button
              class="request-button-reject"
              on:click={() => dispatch("rejectRequest", req.id)}
            >
              Reject
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if outgoingRequests.length > 0}
    <div style="margin-top: 0.5rem;">
      <div class="request-section-title">Outgoing requests</div>
      {#each outgoingRequests as req}
        <div class="request-item">
          <span>{req.addressee.username}</span>
          <span style="font-size: 0.8rem; opacity: 0.8;">Pending</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
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

  @media (min-width: 768px) {
    .friends-panel {
      margin-top: 0;
    }
  }
</style>
