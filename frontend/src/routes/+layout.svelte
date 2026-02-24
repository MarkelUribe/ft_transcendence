<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import UserAvatar from '$lib/UserAvatar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<UserAvatar />

{@render children()}
