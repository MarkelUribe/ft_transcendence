<script>
  import { t } from 'svelte-i18n';
</script>

<footer class="bg-dark text-white-50 py-3 mt-4" data-bs-theme="dark">
  <div class="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
    <small class="text-white-50">© {new Date().getFullYear()} Ultra Xake Online</small>

    <nav class="d-flex gap-3" aria-label="Legal">
      <a
        class="link-light link-underline-opacity-0 link-underline-opacity-100-hover"
        href="/privacy"
      >
        {$t('footer.privacy')}
      </a>
      <a
        class="link-light link-underline-opacity-0 link-underline-opacity-100-hover"
        href="/terms"
      >
       {$t('footer.terms')}
      </a>
    </nav>
  </div>
</footer>
