<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getTopByElo, type RankingUser } from '$lib/api/users';
	import { t } from 'svelte-i18n';

	const BACKEND_URL = import.meta.env.VITE_API_URL;


	export let n = 10;

	let players: RankingUser[] = [];
	let loading = true;
	let error: string | null = null;

	function getToken() {
		if (!browser) return null;
		return localStorage.getItem('token');
	}

	async function loadRanking() {
		loading = true;
		error = null;
		try {
			const token = getToken();
			players = await getTopByElo(n, token);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load ranking';
			players = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadRanking();
	});
</script>

<div
	style="
		width: 100%;
		max-width: 520px;
		padding: 1rem;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #fff;
	"
>
	<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 1rem;">
		<h2 style="margin: 0; font-size: 1.1rem;">{$t('ranking.title')}</h2>
		<span style="opacity: 0.8; font-size: 0.85rem;">{$t('ranking.top', { values: { count: n } })}</span>
	</div>

	{#if loading}
		<p style="margin: 0.8rem 0 0; opacity: 0.85;">{$t('ranking.loading')}</p>
	{:else if error}
		<p style="margin: 0.8rem 0 0; color: #ffd7d7;">{error}</p>
	{:else if players.length === 0}
		<p style="margin: 0.8rem 0 0; opacity: 0.85;">{$t('ranking.no_players')}</p>
	{:else}
		<ol style="list-style: none; padding: 0; margin: 0.8rem 0 0; display: grid; gap: 0.5rem;">
			{#each players as p, index (p.id)}
				<li
					style="
						display: flex;
						align-items: center;
						justify-content: space-between;
						gap: 0.8rem;
						padding: 0.55rem 0.65rem;
						border-radius: 10px;
						background: rgba(255, 255, 255, 0.08);
					"
				>
					<div style="display: flex; align-items: center; gap: 0.7rem; min-width: 0;">
						<span style="width: 2ch; text-align: right; opacity: 0.9;">{index + 1}</span>
						<div style="width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">
							<img
								src={p.avatarUrl ? `${BACKEND_URL}${p.avatarUrl}` : '/pieces/default-avatar.png'}
								alt=""
								style="width: 100%; height: 100%; object-fit: cover; display: block;"
							/>
						</div>
						<a
							href={`/profile/${p.id}`}
							style="
								font-weight: 600;
								overflow: hidden;
								text-overflow: ellipsis;
								white-space: nowrap;
								color: inherit;
								text-decoration: none;
							"
							title={$t('ranking.view_profile', { values: { username: p.username } })}
						>
							{p.username}
						</a>
					</div>

					<span style="font-variant-numeric: tabular-nums; opacity: 0.95;">{p.elo ?? 0} ELO</span>
				</li>
			{/each}
		</ol>
	{/if}
</div>
