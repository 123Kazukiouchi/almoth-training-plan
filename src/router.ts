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

import { getCurrentUser } from './services/authService';

export async function handleRouteChange() {
  const path = getCurrentRoute();
  
  // Auth Guard
  const user = await getCurrentUser();
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
