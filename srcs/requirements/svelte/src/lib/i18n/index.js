import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

register('en', () => import('./locales/en.json'));
register('es', () => import('./locales/es.json'));
register('fr', () => import('./locales/fr.json'));
register('eu', () => import('./locales/eu.json'));

const getInitialLocale = () => {
    if (typeof window === 'undefined') return 'en';

    const saved = localStorage.getItem('user-language');
    if (saved) return saved.toLowerCase();

    const navigatorLocale = getLocaleFromNavigator();
    return navigatorLocale.split('-')[0];
};

init({
    fallbackLocale: 'en',
    initialLocale: 'en',
});