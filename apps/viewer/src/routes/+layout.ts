// Full client-side SPA: every route is rendered in the browser, no
// prerendering, no SSR. The static build is just the SPA shell
// (`index.html`) + JS bundle; nginx's `try_files … /index.html` fallback
// hands every URL to that shell and SvelteKit's client router takes it
// from there. Routes that read runtime state — most importantly
// /sync-cb, which reads `window.location.hash` after the OIDC redirect
// — require this.
export const prerender = false;
export const ssr = false;
