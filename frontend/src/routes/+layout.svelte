<script lang="ts">
	import favicon from '$lib/assets/torre_icono.svg';
	import { locale, waitLocale } from 'svelte-i18n';
	import '$lib/i18n/i18n.js';

	let { children } = $props();

	function changeLanguage(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newLocale = target.value;
		locale.set(newLocale);
		if (typeof window !== 'undefined') {
			localStorage.setItem('language', newLocale);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#await waitLocale()}
	<div class="loading-screen"></div>
{:then}
	<div class="language-selector">
		<select value={$locale} onchange={changeLanguage}>
			<option value="en">English</option>
			<option value="es">Español</option>
			<option value="fr">Français</option>
			<option value="eu">Euskara</option>
		</select>
	</div>

	{@render children()}
{/await}

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', Roboto, sans-serif;
		background: #1e3c72; /* Fondo base para evitar parpadeo blanco */
	}

	.loading-screen {
		height: 100vh;
		width: 100vw;
		background: linear-gradient(135deg, #1e3c72, #2a5298);
	}

	.language-selector {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 1000;
	}

	select {
		padding: 8px 12px;
		border: 2px solid #007bff;
		border-radius: 6px;
		background: white;
		color: #333;
		cursor: pointer;
	}
</style>
