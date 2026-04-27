<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Default from '$lib/Default.svelte';
	import Music from '$lib/Music.svelte';
	import UserAvatar from '$lib/UserAvatar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Music />
<UserAvatar />
<Default />

<nav class="top-nav">
	<a href="/">Jugar</a>
	<a href="/chat">Chat</a>
	<a href="/profile">Perfil</a>
</nav>

{@render children()}

<style>
	nav.top-nav {
		display: flex;
		justify-content: center;
		gap: 2rem;
		padding: 0.75rem;
		background: #1a1a1a;
		border-bottom: 1px solid #333;
	}

	nav.top-nav a {
		color: #888;
		text-decoration: none;
		font-size: 1rem;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: all 0.2s;
	}

	nav.top-nav a:hover {
		color: #fff;
		background: #2a2a2a;
	}
</style>
