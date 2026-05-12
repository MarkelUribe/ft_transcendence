<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import Default from "$lib/Default.svelte";
	import Music from "$lib/Music.svelte";
	import UserAvatar from "$lib/UserAvatar.svelte";
	import { onMount, onDestroy } from "svelte";
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

	function onInviteReceived(e: Event) {
		invite = (e as CustomEvent).detail;
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

	onMount(() => {
		if (!browser) return;
		window.addEventListener(
			"match:inviteReceived",
			onInviteReceived as EventListener,
		);
		window.addEventListener("auth-changed", onAuthChanged as EventListener);
		window.addEventListener(
			"social:invite",
			onSocialInvite as EventListener,
		);

		if (localStorage.getItem("token")) initMatchmakingSocket();
		startFriendsActivityPolling();
	});

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

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Music />
<UserAvatar />
<Default />

{@render children()}

<InviteModal {invite} onAccept={accept} onDecline={decline} />
