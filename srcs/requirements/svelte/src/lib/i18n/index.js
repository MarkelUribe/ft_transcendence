import { register, init, getLocaleFromNavigator, waitLocale } from 'svelte-i18n';

let registered = false;

function registerLocales() {
    if (registered) return;
    registered = true;

    register('en', () => import('./locales/en.json'));
    register('es', () => import('./locales/es.json'));
    register('fr', () => import('./locales/fr.json'));
    register('eu', () => import('./locales/eu.json'));
}

let initialized = false;

export async function setupI18n() {
    registerLocales();
    
    if (initialized) return;
    initialized = true;

    await init({
        fallbackLocale: 'en',
        initialLocale: typeof window === 'undefined'
            ? 'en'
            : (localStorage.getItem('user-language') || getLocaleFromNavigator()?.split('-')[0] || 'en'),
    });
    await waitLocale();
}