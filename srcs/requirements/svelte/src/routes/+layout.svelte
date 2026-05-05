<script lang="ts">
	import '$lib/i18n';
	import { waitLocale } from 'svelte-i18n';
	import favicon from '$lib/assets/favicon.svg';
	import Default from '$lib/Default.svelte';
	import Music from '$lib/Music.svelte';
	import UserAvatar from '$lib/UserAvatar.svelte';
	import LanguageSelector from '$lib/LanguageSelector.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#await waitLocale()}
	<div style="background-color: #121212; height: 100vh; width: 100vw;"></div>
{:then}
	<!-- Esto solo se renderiza cuando i18n ya tiene el idioma inicial listo -->
	<Music />
	<UserAvatar />
	<LanguageSelector />
	<Default />

	{@render children()}
{/await}
