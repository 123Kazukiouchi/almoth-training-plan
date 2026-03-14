// Sidebar navigation component

import { icons } from './icons';
import { navigate, getCurrentRoute } from '../router';

interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
}

const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'ダッシュボード', icon: icons.dashboard, path: '/dashboard' },
    { id: 'goals', label: '目標設定', icon: icons.goals, path: '/goals' },
    { id: 'plans', label: '週次計画', icon: icons.plan, path: '/plans' },
    { id: 'chat', label: 'AI チャット', icon: icons.chat, path: '/chat' },
    { id: 'calendar', label: 'カレンダー', icon: icons.calendar, path: '/calendar' },
    { id: 'subscription', label: 'サブスクリプション', icon: icons.subscription, path: '/subscription' },
];

const bottomNavItems: NavItem[] = [
    { id: 'guide', label: '導入ガイド', icon: icons.guide, path: '/guide' },
    { id: 'settings', label: '設定', icon: icons.settings, path: '/settings' },
];

export function renderSidebar(): string {
    const currentRoute = getCurrentRoute();

    const renderNavItem = (item: NavItem) => {
        const isActive = currentRoute === item.path;
        return `
      <a class="sidebar-nav-item ${isActive ? 'active' : ''}" data-path="${item.path}" id="nav-${item.id}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    `;
    };

    return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          ${icons.logo}
        </div>
        <span class="sidebar-brand-name">Almoth TrainingPlan</span>
      </div>
      <nav class="sidebar-nav">
        ${mainNavItems.map(renderNavItem).join('')}
      </nav>
      <div class="sidebar-bottom">
        ${bottomNavItems.map(renderNavItem).join('')}
      </div>
    </aside>
  `;
}

export function renderTopBar(): string {
    return `
    <div class="top-bar">
      <button class="mobile-menu-btn" id="mobile-menu-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div class="user-avatar" id="user-avatar">BE</div>
    </div>
  `;
}

export function initSidebar() {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const path = (item as HTMLElement).dataset.path;
            if (path) {
                document.body.classList.remove('sidebar-open');
                navigate(path);
            }
        });
    });

    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => {
            document.body.classList.remove('sidebar-open');
        });
    }
}
