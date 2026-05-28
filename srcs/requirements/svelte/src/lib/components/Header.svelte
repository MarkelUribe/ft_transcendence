<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { getExistingGame } from "$lib/api/chess";
  import UserAvatar from "$lib/UserAvatar.svelte";
  import LanguageSelector from "$lib/LanguageSelector.svelte";
  import { t } from 'svelte-i18n';

  const BACKEND_URL = "https://localhost:3000";

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
    <img src="{BACKEND_URL}{'/resources/default.webp'}" width="30px" alt="Logo"/>
    <a class="navbar-brand text-white text-decoration-none" href="/" style="padding-right: 25px;"
      >Ultra Xake Online</a
    >

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
          <a class="nav-link px-2" class:active={isActive("/")} href="/">{$t('header.home')}</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link px-2"
            class:active={isActive("/profile")}
            href="/profile">{$t('header.profile')}</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link px-2"
            class:active={isActive("/historial")}
            href="/historial">{$t('header.history')}</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link px-2"
            class:active={isActive("/ranking")}
            href="/ranking">{$t('header.ranking')}</a
          >
        </li>
        
      </ul>

      <div class="d-flex align-items-center gap-3">
        {#if showResume}
          <a
            class="btn btn-warning fw-semibold me-3 in-game-cta"
            href={`/game/${activeGameId}`}
          >
            {$t('header.resume_game')}
            <span class="badge text-bg-danger ms-2">{$t('header.in_game')}</span>
          </a>
        {/if}

        <UserAvatar />
        <LanguageSelector />
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
