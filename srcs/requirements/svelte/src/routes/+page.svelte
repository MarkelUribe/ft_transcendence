<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import {
        handleButtonClick,
        searching,
        disconnectMatchmakingSocket,
        stopFriendsActivityPolling,
    } from "$lib/Matchmaking";
    import { disconnectChat } from "$lib/api/chat";
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

        // desconecta sockets y polling
        disconnectMatchmakingSocket();
        stopFriendsActivityPolling();
        disconnectChat();

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

<div class="home-layout">
    <div class="home-main">
        <div class="container">
            <h1 class="hero-title">
                <span class="hero-sub">Welcome to</span>
                <span class="hero-main">Ultra Xake Online</span>
            </h1>
            <p>
                {#if isLoggedIn}
                    Hello, {username}! Ready to play?
                {:else}
                    Play chess, review your game logs, and improve your
                    strategy. Choose what you want to do below:
                {/if}
            </p>

            <div class="buttons">
                {#if isLoggedIn}
                    <button
                        class="button {$searching ? 'searching' : 'idle'}"
                        onclick={handleButtonClick}
                    >
                        {$searching ? "Searching... (Click to cancel)" : "Play"}
                    </button>
                    <button class="button" onclick={handleLogout}>Logout</button
                    >
                {:else}
                    <button class="button" onclick={handleLogin}>Login</button>
                {/if}
            </div>
        </div>
    </div>
    {#if isLoggedIn}
        <aside class="home-chat">
            <ChatWidget showGameChat={false} onSendGameChat={() => {}} />
        </aside>
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 70vh;
        text-align: center;
        position: relative;
        z-index: 1;
    }

    .hero-title {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
        line-height: 1;
    }

    .hero-sub {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.85);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font-weight: 700;
        opacity: 0.95;
    }

    .hero-main {
        font-size: clamp(2rem, 6vw, 3.2rem);
        font-weight: 800;
        color: #ffffff; /* higher contrast */
        text-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
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

    @media (max-width: 1100px) {
    }
    .home-layout {
        width: min(1200px, 100%);
        margin: 0 auto;
        padding: 1rem;

        display: grid;
        grid-template-columns: 1fr minmax(0, 640px) minmax(280px, 320px) 1fr;
        gap: 1rem;
        align-items: start;
    }

    .home-main {
        grid-column: 2;
    }
    .home-chat {
        grid-column: 3;
        justify-self: end;
        margin-top: 4rem; /* moves it lower */
        position: static; /* “moves with the page” (not sticky) */
    }

    /* Mobile: stack + center chat horizontally */
    @media (max-width: 768px) {
        .home-layout {
            grid-template-columns: 1fr;
        }
        .home-main,
        .home-chat {
            grid-column: 1;
        }

        .home-chat {
            margin-top: 1rem;
            justify-self: center;
            width: min(320px, 100%);
        }

        .container {
            height: auto;
        }
    }
</style>
