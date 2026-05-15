<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    const userId = localStorage.getItem('id');
    if (userId) {
      goto(`/historial/${userId}`);
    } else {
      goto('/login');
    }
  });
</script>

<p>Redirecting...</p>