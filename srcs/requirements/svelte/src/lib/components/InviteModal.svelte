<script lang="ts">
    import { t } from 'svelte-i18n';

    type InvitePayload = {
        inviteId: string;
        inviterUsername: string;
    };

    let { invite, onAccept, onDecline } = $props<{
        invite: InvitePayload | null;
        onAccept: (inviteId: string) => void;
        onDecline: (inviteId: string) => void;
    }>();

    function accept() {
        if (!invite) return;
        onAccept(invite.inviteId);
    }

    function decline() {
        if (!invite) return;
        onDecline(invite.inviteId);
    }
</script>

{#if invite}
    <div class="confirm-overlay">
        <div class="confirm-box">
            <h2>{$t('inviteModal.title')}</h2>
            <p><b>{invite.inviterUsername}</b> {$t('inviteModal.message')}</p>

            <div class="actions">
                <button class="cancel" onclick={decline}>{$t('inviteModal.decline')}</button>
                <button class="confirm" onclick={accept}>{$t('inviteModal.accept')}</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .confirm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .confirm-box {
        background: #1e1e1e;
        color: white;
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: pop 0.2s ease;
        min-width: 280px;
        max-width: 360px;
    }

    .confirm-box p {
        color: #ccc;
        margin-bottom: 20px;
    }

    .actions {
        display: flex;
        gap: 10px;
        justify-content: center;
    }

    .cancel {
        background: #444;
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 6px;
        cursor: pointer;
    }

    .confirm {
        background: #ff4d4d;
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
    }

    @keyframes pop {
        from {
            transform: scale(0.8);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
</style>