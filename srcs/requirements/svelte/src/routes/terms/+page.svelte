<script>
	import { t } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$t('terms.meta_title')}</title>
</svelte:head>

<div class="container py-4" style="max-width: 900px;">
	<h1 class="text-white">{$t('terms.title')}</h1>
	<p class="text-white-50 mb-4">{$t('terms.last_updated')}</p>

	<p class="text-white-50">
		{$t('terms.intro')}
	</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.1.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.1.text')}</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.2.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.2.text')}</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.3.title')}</h2>
	<ul class="text-white-50">
		<li>{$t('terms.sections.3.items.1')}</li>
		<li>{$t('terms.sections.3.items.2')}</li>
		<li>{$t('terms.sections.3.items.3')}</li>
	</ul>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.4.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.4.intro')}</p>
	<ul class="text-white-50">
		<li>{$t('terms.sections.4.items.1')}</li>
		<li>{$t('terms.sections.4.items.2')}</li>
		<li>{$t('terms.sections.4.items.3')}</li>
		<li>{$t('terms.sections.4.items.4')}</li>
		<li>{$t('terms.sections.4.items.5')}</li>
	</ul>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.5.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.5.text')}</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.6.title')}</h2>
	<ul class="text-white-50">
		<li>{$t('terms.sections.6.items.1')}</li>
		<li>{$t('terms.sections.6.items.2')}</li>
		<li>{$t('terms.sections.6.items.3')}</li>
	</ul>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.7.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.7.text')}</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.8.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.8.text')}</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.9.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.9.text')}</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.10.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.10.text')}</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.11.title')}</h2>
	<p class="text-white-50">{$t('terms.sections.11.text')}</p>


	<h2 class="h4 text-white mt-4">{$t('terms.sections.12.title')}</h2>
	<p class="text-white-50 mb-0">{$t('terms.sections.12.text')}</p>
</div>