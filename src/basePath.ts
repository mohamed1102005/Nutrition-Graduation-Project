// The app can be served from a sub-path (GitHub Pages project sites live at /<repo>/).
// Vite exposes that path as BASE_URL, always with a trailing slash ("/" in dev).
const BASE = import.meta.env.BASE_URL

/** react-router basename: no trailing slash, and "/" when served from the root. */
export const routerBasename = BASE === '/' ? '/' : BASE.replace(/\/$/, '')

/** A URL for something in /public (images, video) that works under any base. */
export const assetUrl = (path: string) => `${BASE}${path.replace(/^\//, '')}`

/** A full-page URL for a route, for places that use window.location instead of the router. */
export const routeUrl = (path: string) => assetUrl(path)

/** True when the current page is one of the given routes (so redirects don't loop). */
export const onRoute = (...paths: string[]) => paths.some((p) => window.location.pathname.startsWith(routeUrl(p)))
