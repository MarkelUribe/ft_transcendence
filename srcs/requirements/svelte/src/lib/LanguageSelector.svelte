<script lang="ts">
    import { onMount } from 'svelte';
    import { locale } from 'svelte-i18n';

	let isOpen = $state(false);
    let container = $state<HTMLElement | null>(null);
	
	const languages = [
		{ label: 'English', id: 'en' },
		{ label: 'Español', id: 'es' },
		{ label: 'Français', id: 'fr' },
        { label: 'Euskara', id: 'eu' },
	];

	let currentLang = $state(languages[0]);

    onMount(() => {
        const unsubscribe = locale.subscribe((value) => {
            const found = languages.find(l => l.id === value);
            if (found) currentLang = found;
        });

		const savedId = localStorage.getItem('user-language');
		if (savedId) {
			const found = languages.find(l => l.id === savedId);
			if (found) {
                currentLang = found;
                locale.set(found.id);
            }
		}

        const handleClickOutside = (event: MouseEvent) => {
			if (isOpen && container && !container.contains(event.target as Node)) {
				isOpen = false;
			}
		};

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
            unsubscribe();
		};
    });

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function selectLanguage(lang: typeof languages[0]) {
		currentLang = lang;
		isOpen = false;
        locale.set(lang.id);
        localStorage.setItem('user-language', lang.id);
	}
</script>

<div class="lang-selector" bind:this={container}>
	<button class="selected-item" onclick={toggleMenu} aria-expanded={isOpen}>
		<span class="label">{currentLang.id.toUpperCase()}</span>
		<span class="arrow {isOpen ? 'rotate' : ''}">▼</span>
	</button>

	{#if isOpen}
		<div class="dropdown-menu">
			{#each languages as lang}
				<button 
					class="menu-item {currentLang.id === lang.id ? 'active' : ''}" 
					onclick={() => selectLanguage(lang)}
				>
					{lang.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.lang-selector {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 10000;
		font-family: sans-serif;
	}

	.selected-item {
		display: flex;
		align-items: center;
		gap: 12px;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 10px 18px;
		border-radius: 10px;
		color: white;
		cursor: pointer;
		font-weight: 500;
		transition: border-color 0.2s;
	}

	.selected-item:hover {
		border-color: rgba(255, 255, 255, 0.4);
	}

	.arrow {
		font-size: 0.65rem;
		transition: transform 0.3s;
		opacity: 0.8;
	}

	.arrow.rotate {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		background: #121212;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		min-width: 130px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 25px rgba(0,0,0,0.6);
		overflow: hidden;
	}

	.menu-item {
		padding: 12px 16px;
		background: transparent;
		border: none;
		color: #bbb;
		cursor: pointer;
		text-align: left;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.menu-item:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.menu-item.active {
		color: #00d2ff;
		background: rgba(0, 210, 255, 0.05);
	}
</style>