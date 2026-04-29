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

{@render children()}
