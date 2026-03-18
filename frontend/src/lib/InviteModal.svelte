<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let fromUsername: string | null = null;
  export let open = false;

  const dispatch = createEventDispatcher();

  function accept() {
    dispatch("accept");
  }

  function decline() {
    dispatch("decline");
  }
</script>

{#if open}
  <div class="invite-overlay">
    <div class="invite-modal">
      <div class="invite-title">Match invitation</div>
      <div class="invite-text">
        {fromUsername ?? "A friend"} invited you to a match.
      </div>
      <div class="invite-actions">
        <button class="invite-accept" on:click={accept}>Accept</button>
        <button class="invite-decline" on:click={decline}>Decline</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .invite-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .invite-modal {
    background: rgba(10, 22, 56, 0.95);
    border-radius: 16px;
    padding: 1.5rem 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    max-width: 320px;
    text-align: center;
  }

  .invite-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .invite-text {
    font-size: 0.95rem;
    margin-bottom: 1rem;
    opacity: 0.9;
  }

  .invite-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  .invite-accept,
  .invite-decline {
    padding: 0.4rem 0.9rem;
    font-size: 0.9rem;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    color: #fff;
  }

  .invite-accept {
    background: linear-gradient(135deg, #43cea2, #185a9d);
  }

  .invite-decline {
    background: linear-gradient(135deg, #f44336, #e91e63);
  }
</style>
