<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { getExistingGame } from "$lib/api/chess";
  import UserAvatar from "$lib/UserAvatar.svelte";

  const BACKEND_URL = import.meta.env.VITE_API_URL;


  let activeGameId: string | null = null;
  let lastCheckAt = 0;
  const CHECK_EVERY_MS = 10_000;

  const isActive = (href: string) => {
    const path = $page.url.pathname;
    if (href === "/") return path === "/";
    return path === href || path.startsWith(`${href}/`);
  };

  async function refreshActiveGame(force = false) {
    if (!browser) return;

    const token = localStorage.getItem("token");
    if (!token) {
      activeGameId = null;
      return;
    }

    const now = Date.now();
    if (!force && now - lastCheckAt < CHECK_EVERY_MS) return;
    lastCheckAt = now;

    const game = await getExistingGame(token);
    activeGameId = game?.gameId ?? null;
  }

  onMount(() => {
    void refreshActiveGame(true);

    const onAuthChanged = (event: Event) => {
      const status = (event as CustomEvent).detail?.status;
      if (status === "loggedOut") activeGameId = null;
      if (status === "loggedIn") void refreshActiveGame(true);
    };

    window.addEventListener("auth-changed", onAuthChanged as EventListener);
    return () =>
      window.removeEventListener(
        "auth-changed",
        onAuthChanged as EventListener,
      );
  });

  // Si estás dentro de /game/[gameId], guardamos ese id como “activo”
  $: if (
    browser &&
    $page.url.pathname.startsWith("/game/") &&
    $page.params.gameId
  ) {
    activeGameId = $page.params.gameId;
  }

  // Si no estás en /game, revalidamos (throttle) por si la partida terminó o existe una activa
  $: if (browser && !$page.url.pathname.startsWith("/game/")) {
    void refreshActiveGame(false);
  }

  $: showResume =
    !!activeGameId && !$page.url.pathname.startsWith(`/game/${activeGameId}`);
</script>

<header
  class="navbar navbar-expand-md p-3 bg-dark text-white sticky-top" data-bs-theme="dark"
>
  <div class="container">
    <img src="{BACKEND_URL}{'/resources/default.webp'}" width="36px" height="36px" alt="Logo" style="margin-right:8px;"/>
    <a class="navbar-brand text-white text-decoration-none site-title" href="/" style="padding-right: 25px;">
      <span class="header-main">Ultra Xake Online</span>
    </a>

    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#mainNav"
      aria-controls="mainNav"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav me-auto mb-2 mb-md-0">
        <li class="nav-item">
          <a class="nav-link px-2" class:active={isActive("/")} href="/">Home</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link px-2"
            class:active={isActive("/profile")}
            href="/profile">Profile</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link px-2"
            class:active={isActive("/historial")}
            href="/historial">Historial</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link px-2"
            class:active={isActive("/ranking")}
            href="/ranking">Ranking</a
          >
        </li>
        
      </ul>

      <div class="d-flex align-items-center">
        {#if showResume}
          <a
            class="btn btn-warning fw-semibold me-3 in-game-cta"
            href={`/game/${activeGameId}`}
          >
            Volver a la partida
            <span class="badge text-bg-danger ms-2">EN PARTIDA</span>
          </a>
        {/if}

        <UserAvatar />
      </div>
    </div>
  </div>
</header>

<style>
  .navbar li {
    font-size: 20px;
    padding-right: 15px;
  }

  .in-game-cta {
    white-space: nowrap;
    animation: inGamePulse 1.2s ease-in-out infinite;
  }

  .site-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    line-height: 1;
  }

  .header-main {
    font-size: 1rem;
    font-weight: 800;
    color: #ffffff; /* stronger contrast against dark header */
    text-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
  }

  @keyframes inGamePulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(var(--bs-warning-rgb), 0);
    }
    50% {
      box-shadow: 0 0 0 0.35rem rgba(var(--bs-warning-rgb), 0.35);
    }
  }
</style>
