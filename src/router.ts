// Simple hash-based router for SPA navigation

type RouteHandler = () => string | Promise<string>;

interface Route {
  path: string;
  handler: RouteHandler;
}

const routes: Route[] = [];
let currentCleanup: (() => void) | null = null;

export function addRoute(path: string, handler: RouteHandler) {
  routes.push({ path, handler });
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function getCurrentRoute(): string {
  return window.location.hash.slice(1) || '/login';
}

import { getCachedUser } from './services/authService';

export async function handleRouteChange() {
  const hash = window.location.hash.slice(1); // e.g. "error=access_denied&..." or "/dashboard"

  // Supabase returns errors/tokens as query-string-style hash fragments (not routes)
  if (hash.includes('error=') || hash.includes('access_token=')) {
    const params = new URLSearchParams(hash);
    if (params.get('error')) {
      // Store the error so login page can display it, then go to login
      const desc = params.get('error_description') || params.get('error') || 'ログインエラーが発生しました';
      sessionStorage.setItem('auth_error', decodeURIComponent(desc.replace(/\+/g, ' ')));
      window.location.hash = '/login';
      return;
    }
    // access_token case is handled by Supabase SDK via onAuthStateChange — just go to login
    window.location.hash = '/login';
    return;
  }

  const path = getCurrentRoute();

  // Auth Guard (sync - reads from localStorage, no network needed)
  const user = getCachedUser();
  if (!user && path !== '/login') {
    window.location.hash = '/login';
    return;
  }
  if (user && path === '/login') {
    window.location.hash = '/dashboard';
    return;
  }

  const route = routes.find(r => r.path === path);
  
  if (route) {
    const app = document.getElementById('app');
    if (app) {
      // Cleanup previous page
      if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
      }
      
      const html = await route.handler();
      app.innerHTML = html;
      
      // Dispatch custom event for page initialization
      window.dispatchEvent(new CustomEvent('route-changed', { detail: { path } }));
    }
  }
}

export function setCleanup(fn: () => void) {
  currentCleanup = fn;
}

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  
  // Initial route
  if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
    window.location.hash = '#/login';
  } else {
    handleRouteChange();
  }
}
