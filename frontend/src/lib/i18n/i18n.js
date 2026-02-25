import { register, init, addMessages, getLocaleFromNavigator } from 'svelte-i18n';
import { browser } from '$app/environment';
import en from './locales/en.json';

// Añadir mensajes de inglés de forma síncrona para soportar SSR
addMessages('en', en);

// Registrar otros idiomas de forma asíncrona
register('es', () => import('./locales/es.json'));
register('fr', () => import('./locales/fr.json'));
register('eu', () => import('./locales/eu.json'));

// Inicializar i18n con un locale por defecto. En SSR siempre habrá 'en'.
const DEFAULT_LOCALE = 'en';
let initialLocale = DEFAULT_LOCALE;

if (browser) {
  const saved = localStorage.getItem('language');
  if (saved) {
    initialLocale = saved;
  } else {
    const nav = getLocaleFromNavigator();
    initialLocale = (nav || DEFAULT_LOCALE).split('-')[0];
  }
}

init({
  fallbackLocale: DEFAULT_LOCALE,
  initialLocale,
});
