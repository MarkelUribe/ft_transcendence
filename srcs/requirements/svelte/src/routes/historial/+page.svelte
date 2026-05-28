<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  onMount(() => {
    const userId = localStorage.getItem('id');
    if (userId) {
      goto(`/historial/${userId}`);
    } else {
      goto('/login');
    }
  });
</script>

<p>{$t('history.status.redirecting')}</p>