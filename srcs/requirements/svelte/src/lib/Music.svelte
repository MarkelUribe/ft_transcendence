<script>
	import { onMount } from 'svelte';

	let audio;
	let isMuted = false;
	let volume = 1;

	const STORAGE_KEY = 'music-player-state';

	function saveState() {
		if (typeof window === 'undefined') return;

		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				isMuted,
				volume
			})
		);
	}

	function loadState() {
		if (typeof window === 'undefined') return;

		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return;

		try {
			const data = JSON.parse(saved);

			if (typeof data.volume === 'number') {
				volume = data.volume;
			}

			if (typeof data.isMuted === 'boolean') {
				isMuted = data.isMuted;
			}
		} catch (_) {}
	}

	onMount(() => {
		loadState();

		audio.volume = volume;
		audio.muted = isMuted;

		// try autoplay
		audio.play().catch(() => {
			// fallback: wait for user interaction
			const resume = () => {
				audio.play();
				window.removeEventListener('click', resume);
			};
			window.addEventListener('click', resume);
		});
	});

	function toggleMute() {
		isMuted = !isMuted;
		audio.muted = isMuted;
		saveState();
	}

	function changeVolume(event) {
		volume = parseFloat(event.target.value);
		audio.volume = volume;
		saveState();
	}
	
</script>

<div class="app">
	<audio bind:this={audio} src="/music.mp3" loop></audio>

	<div class="player">
		<button class="circle-btn" on:click={toggleMute} aria-label="Play/Pause">
			<span class="icon">{isMuted ? '🔇' : '🔊'}</span>
		</button>

		<div class="slider-wrap">
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={volume}
				on:input={changeVolume}
				class="volume-slider"
			/>
		</div>
	</div>
</div>

<style>
	.app {
		position: fixed;
		bottom: 20px;
		left: 20px;
		z-index: 9999;
	}

	.player {
		display: flex;
		align-items: center;
		gap: 1rem;

		padding: 1rem 1.25rem;
		border-radius: 999px;

		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);

		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);

		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.circle-btn {
		width: 70px;
		height: 70px;
		border-radius: 999px;
		border: none;
		cursor: pointer;
		display: grid;
		place-items: center;
		font-size: 26px;
		color: white;

		background: linear-gradient(135deg, #6366f1, #22c55e);
		box-shadow:
			0 0 20px rgba(99, 102, 241, 0.4),
			0 10px 20px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);

		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.circle-btn:hover {
		transform: scale(1.08);
		box-shadow:
			0 0 30px rgba(34, 197, 94, 0.6),
			0 14px 30px rgba(0, 0, 0, 0.5);
	}

	.circle-btn:active {
		transform: scale(0.96);
	}

	.slider-wrap {
		display: flex;
		align-items: center;
	}

	.volume-slider {
		width: 140px;
		accent-color: #22c55e;
		cursor: pointer;
	}

	.icon {
		line-height: 1;
	}
</style>