<script lang="ts">
	import "bootstrap/dist/css/bootstrap.min.css";
	import favicon from "$lib/assets/favicon.svg";
	import Default from "$lib/Default.svelte";
	import { onMount, onDestroy } from "svelte";
	import { setupI18n } from '$lib/i18n';
	import { browser } from "$app/environment";
	import {
		initMatchmakingSocket,
		acceptInvite,
		rejectInvite,
		inviteFriend,
	} from "$lib/Matchmaking";
	import InviteModal from "$lib/components/InviteModal.svelte";
	import {
		startFriendsActivityPolling,
		stopFriendsActivityPolling,
	} from "$lib/Matchmaking";
	import Header from "$lib/components/Header.svelte";
	import Footer from "$lib/components/Footer.svelte";


	function onSocialInvite(e: Event) {
		const friendId = Number((e as CustomEvent).detail?.friendId);
		if (Number.isFinite(friendId)) inviteFriend(friendId);
	}

	function onAuthChanged(e: Event) {
		const status = (e as CustomEvent).detail?.status;
		if (status === "loggedIn") initMatchmakingSocket();
		// if you add a disconnect helper, call it on "loggedOut"
	}

	type InvitePayload = { inviteId: string; inviterUsername: string };

	let invite: InvitePayload | null = $state(null);
	let ready = $state(false);

	function onInviteReceived(e: Event) {
		invite = (e as CustomEvent).detail;
	}

	export async function load() {
    	await setupI18n();
    	return {};
	}

	function accept() {
		if (!invite) return;
		acceptInvite(invite.inviteId);
		invite = null;
	}

	function decline() {
		if (!invite) return;
		rejectInvite(invite.inviteId);
		invite = null;
	}

	onMount(async () => {

		await setupI18n();
        ready = true;

		if (!browser) return;
		window.addEventListener(
			"match:inviteReceived",
			onInviteReceived as EventListener,
		);
		  void import("bootstrap/dist/js/bootstrap.bundle.min.js");
		window.addEventListener("auth-changed", onAuthChanged as EventListener);
		window.addEventListener(
			"social:invite",
			onSocialInvite as EventListener,
		);

		if (localStorage.getItem("token")) initMatchmakingSocket();
		startFriendsActivityPolling();
	});

	let { children } = $props();

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener(
			"auth-changed",
			onAuthChanged as EventListener,
		);
		window.removeEventListener(
			"social:invite",
			onSocialInvite as EventListener,
		);
		window.removeEventListener(
			"match:inviteReceived",
			onInviteReceived as EventListener,
		);
		stopFriendsActivityPolling();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if ready}
	<Default />

	<div class="app-shell">
  		<Header />
  		<main class="app-main">
    		{@render children()}
  		</main>
  		<Footer />
	</div>
	<InviteModal invite={invite} onAccept={accept} onDecline={decline} />
{/if}
<style>
  .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
  .app-main { flex: 1; }
</style>