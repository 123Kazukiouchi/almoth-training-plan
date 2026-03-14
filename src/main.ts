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

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

