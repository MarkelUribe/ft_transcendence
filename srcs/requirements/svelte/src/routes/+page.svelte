<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { handleButtonClick, searching } from "$lib/Matchmaking";
    import ChatWidget from "../lib/components/ChatWidget.svelte";

    let username = "";
    let isLoggedIn = false;

    onMount(() => {
        if (!browser) return;

        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");

        if (token && storedUsername) {
            isLoggedIn = true;
            username = storedUsername;
        }
    });

    function handleLogin() {
        goto("/login");
    }

    function handleLogout() {
        if (!browser) return;

        localStorage.removeItem("token");
        localStorage.removeItem("id");
        localStorage.removeItem("username");
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
            <button class="button {$searching ? 'searching' : 'idle'}" onclick={handleButtonClick}>
                {$searching ? "Searching... (Click to cancel)" : "Play"}
            </button>
            <button class="button" onclick={handleLogout}>Logout</button>
        {:else}
            <button class="button" onclick={handleLogin}>Login</button>
        {/if}
    </div>
</div>

{#if isLoggedIn}
    <div class="responsive-chat">
        <ChatWidget />
    </div>
{/if}

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
		background: linear-gradient(90deg, #24c6dc, #514a9d);
    }

    .button:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }

    .button.searching {
        background: linear-gradient(90deg, #ff512f, #dd2476);
        animation: pulse 1.2s infinite;
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

    .responsive-chat {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 1000;
    }

    @media (max-width: 1100px) {
        .responsive-chat {
            display: none;
        }
    }
</style>