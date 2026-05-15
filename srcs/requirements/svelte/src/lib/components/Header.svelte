<script lang="ts">
	import { page } from "$app/stores";
    import UserAvatar from "$lib/UserAvatar.svelte";

	const BACKEND_URL = 'https://localhost:3000';


	const isActive = (href: string) => {
		const path = $page.url.pathname;
		if (href === "/") return path === "/";
		return path === href || path.startsWith(`${href}/`);
	};
</script>

<header class="navbar navbar-expand-md p-3 bg-dark text-white" data-bs-theme="dark">
  <div class="container">
  <img src="{BACKEND_URL}{'/resources/default.webp'}" width="30px">
    <a class="navbar-brand text-white text-decoration-none" href="/">Chess Arena</a>

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
          <a class="nav-link px-2" class:active={isActive("/")} href="/">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link px-2" class:active={isActive("/profile")} href="/profile">Profile</a>
        </li>
		<li class="nav-item">
          <a class="nav-link px-2" class:active={isActive("/ranking")} href="/ranking">Ranking</a>
        </li>
      </ul>

      <div class="d-flex">
        <UserAvatar />
      </div>
    </div>
  </div>
</header>

<style>
	.navbar li{
		font-size: 20px;
		padding-right: 15px;
	}
</style>