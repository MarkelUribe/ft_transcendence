
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/game" | "/game/[gameId]" | "/login" | "/profile" | "/register";
		RouteParams(): {
			"/game/[gameId]": { gameId: string }
		};
		LayoutParams(): {
			"/": { gameId?: string };
			"/game": { gameId?: string };
			"/game/[gameId]": { gameId: string };
			"/login": Record<string, never>;
			"/profile": Record<string, never>;
			"/register": Record<string, never>
		};
		Pathname(): "/" | "/game" | `/game/${string}` & {} | "/login" | "/profile" | "/register";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/pieces/B.png" | "/pieces/K.png" | "/pieces/N.png" | "/pieces/P.png" | "/pieces/Q.png" | "/pieces/R.png" | "/pieces/b.png" | "/pieces/k.png" | "/pieces/n.png" | "/pieces/p.png" | "/pieces/q.png" | "/pieces/r.png" | "/robots.txt" | string & {};
	}
}