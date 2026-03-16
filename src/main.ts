// Main entry point - registers all routes and initializes the app

import './style.css';
import { addRoute, initRouter, setCleanup } from './router';
import { initSidebar } from './components/sidebar';

// Pages
import { renderLogin, initLogin } from './pages/login';
import { renderDashboard, initDashboard, cleanupDashboard } from './pages/dashboard';
import { renderGoals, initGoals } from './pages/goals';
import { renderPlans, initPlans } from './pages/plans';
import { renderAiChat, initAiChat } from './pages/aiChat';
import { renderCalendar, initCalendar } from './pages/calendar';
import { renderSubscription, initSubscription } from './pages/subscription';
import { renderSettings, initSettings } from './pages/settings';
import { renderGuide, initGuide } from './pages/guide';

import { storage } from './utils/storage';
import { supabase } from './utils/supabaseClient';

// Register routes
addRoute('/login', () => renderLogin());
addRoute('/dashboard', () => renderDashboard());
addRoute('/goals', () => renderGoals());
addRoute('/plans', () => renderPlans());
addRoute('/chat', () => renderAiChat());
addRoute('/calendar', () => renderCalendar());
addRoute('/subscription', () => renderSubscription());
addRoute('/settings', () => renderSettings());
addRoute('/guide', () => renderGuide());

// Initialize page-specific functionality after route change
window.addEventListener('route-changed', (e) => {
  const { path } = (e as CustomEvent).detail;

  switch (path) {
    case '/login':
      initLogin();
      break;
    case '/dashboard':
      initDashboard();
      initSidebar();
      setCleanup(cleanupDashboard);
      break;
    case '/goals':
      initGoals();
      initSidebar();
      break;
    case '/plans':
      initPlans();
      initSidebar();
      break;
    case '/chat':
      initAiChat();
      initSidebar();
      break;
    case '/calendar':
      initCalendar();
      initSidebar();
      break;
    case '/subscription':
      initSubscription();
      initSidebar();
      break;
    case '/settings':
      initSettings();
      initSidebar();
      break;
    case '/guide':
      initGuide();
      initSidebar();
      break;
  }
});

// Start the router
initRouter();

// Initialize data sync from Supabase
storage.pullAll();

// Listen for auth changes and re-pull if necessary (e.g. after login)
supabase.auth.onAuthStateChange(async (_event, session) => {
  const SESSION_KEY = 'almoth_auth_session';
  
  if (session && session.user) {
    // Update local session for getCachedUser()
    const user = {
      email: session.user.email || '',
      id: session.user.id,
      lastLogin: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    
    // Explicitly link authenticated email to profile storage
    if (user.email) {
      storage.setItem('user_email', user.email);
    }
    
    // Migrate data from guest to user account
    await storage.migrateGuestToUser();
    
    // Then pull everything from cloud
    await storage.pullAll();
    storage.setItem('_last_sync_time', Date.now().toString());

    // Force transition to dashboard on login
    const currentHash = window.location.hash;
    if (currentHash.includes('access_token') || currentHash === '#/login' || currentHash === '' || currentHash === '#/') {
        window.location.hash = '#/dashboard';
        // Give router a tiny moment to see the hash change before reloading
        setTimeout(() => window.location.reload(), 100);
    }
  } else {
    // Don't wipe dev sessions (set by devLogin() for local development)
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed.id && parsed.id.startsWith('dev-user-')) return;
      } catch {}
    }
    localStorage.removeItem(SESSION_KEY);
  }
});

