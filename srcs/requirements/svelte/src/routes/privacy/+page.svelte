<script>
	import { t } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$t('privacy.meta_title')}</title>
</svelte:head>

<div class="container py-4" style="max-width: 900px;">
	<h1 class="text-white">{$t('privacy.title')}</h1>
	<p class="text-white-50 mb-4">
		{$t('privacy.last_updated')}
	</p>

	<p class="text-white-50">
		{$t('privacy.intro')}
	</p>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.1.title')}</h2>
	<ul class="text-white-50">
		<li>
			<strong>{$t('privacy.sections.1.items.account.bold')}</strong>{$t('privacy.sections.1.items.account.text')}
		</li>
		<li>
			<strong>{$t('privacy.sections.1.items.profile.bold')}</strong>{$t('privacy.sections.1.items.profile.text')}
		</li>
		<li>
			<strong>{$t('privacy.sections.1.items.gameplay.bold')}</strong>{$t('privacy.sections.1.items.gameplay.text')}
		</li>
		<li>
			<strong>{$t('privacy.sections.1.items.social.bold')}</strong>{$t('privacy.sections.1.items.social.text')}
		</li>
		<li>
			<strong>{$t('privacy.sections.1.items.technical.bold')}</strong>{$t('privacy.sections.1.items.technical.text')}
		</li>
	</ul>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.2.title')}</h2>
	<ul class="text-white-50">
		<li>{$t('privacy.sections.2.items.1')}</li>
		<li>{$t('privacy.sections.2.items.2')}</li>
		<li>{$t('privacy.sections.2.items.3')}</li>
		<li>{$t('privacy.sections.2.items.4')}</li>
		<li>{$t('privacy.sections.2.items.5')}</li>
	</ul>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.3.title')}</h2>
	<p class="text-white-50">{$t('privacy.sections.3.p1')}</p>
	<p class="text-white-50">{$t('privacy.sections.3.p2')}</p>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.4.title')}</h2>
	<p class="text-white-50">{$t('privacy.sections.4.text')}</p>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.5.title')}</h2>
	<p class="text-white-50">{$t('privacy.sections.5.text')}</p>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.6.title')}</h2>
	<p class="text-white-50">{$t('privacy.sections.6.text')}</p>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.7.title')}</h2>
	<ul class="text-white-50">
		<li>{$t('privacy.sections.7.items.1')}</li>
		<li>{$t('privacy.sections.7.items.2')}</li>
		<li>{$t('privacy.sections.7.items.3')}</li>
	</ul>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.8.title')}</h2>
	<p class="text-white-50">{$t('privacy.sections.8.text')}</p>

	<h2 class="h4 text-white mt-4">{$t('privacy.sections.9.title')}</h2>
	<p class="text-white-50 mb-0">{$t('privacy.sections.9.text')}</p>
</div>