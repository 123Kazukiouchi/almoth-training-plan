// Guide page

import { renderSidebar, renderTopBar } from '../components/sidebar';
import { icons } from '../components/icons';

export function renderGuide(): string {
    return `
    ${renderSidebar()}
    ${renderTopBar()}
    <main class="main-content main-content-with-topbar">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">${icons.guide}</div>
          <div>
            <h1 class="page-title">導入ガイド</h1>
            <p class="page-subtitle">トレーニングプラン自動生成への6ステップ</p>
          </div>
        </div>
      </div>

      <div class="onboarding-grid">
        <!-- Step 1 -->
        <a href="#" class="onboarding-card" data-step="1">
          <div class="onboarding-step-indicator">
            <div class="onboarding-step-number">1</div>
            <div class="onboarding-step-icon">
              <!-- Hand Wave Emoji as SVG placeholder -->
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-3"/><path d="M10 20v-4a2 2 0 0 1 4 0v4"/><path d="M10 18H6a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4h2"/><path d="M10 14V4a2 2 0 0 1 4 0v10"/></svg>
            </div>
          </div>
          <h2 class="onboarding-card-title">ようこそ！</h2>
          <p class="onboarding-card-desc">まずはアカウントの基本設定を行いましょう。あなたのプロフィール情報を確認・入力します。</p>
          <div class="onboarding-card-action">設定へ進む ${icons.chevronRight}</div>
        </a>

        <!-- Step 2 -->
        <a href="#" class="onboarding-card" data-step="2">
          <div class="onboarding-step-indicator">
            <div class="onboarding-step-number">2</div>
            <div class="onboarding-step-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
          </div>
          <h2 class="onboarding-card-title">Intervalsと連携</h2>
          <p class="onboarding-card-desc">AI分析の要となる Intervals.icu と連携し、過去のトレーニングデータを自動で取り込みます。</p>
          <div class="onboarding-card-action">連携設定へ ${icons.chevronRight}</div>
        </a>

        <!-- Step 3 -->
        <a href="#" class="onboarding-card" data-step="3">
          <div class="onboarding-step-indicator">
            <div class="onboarding-step-number">3</div>
            <div class="onboarding-step-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </div>
          </div>
          <h2 class="onboarding-card-title">Garmin / Strava</h2>
          <p class="onboarding-card-desc">普段お使いのデバイス・アプリのデータをIntervals側に集約する設定を確認します。</p>
          <div class="onboarding-card-action">詳細を見る ${icons.chevronRight}</div>
        </a>

        <!-- Step 4 -->
        <a href="#" class="onboarding-card" data-step="4">
          <div class="onboarding-step-indicator">
            <div class="onboarding-step-number">4</div>
            <div class="onboarding-step-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          </div>
          <h2 class="onboarding-card-title">目標の設定</h2>
          <p class="onboarding-card-desc">ターゲットレースやトレーニングの目的、利用可能な練習時間を設定します。</p>
          <div class="onboarding-card-action">目標画面へ ${icons.chevronRight}</div>
        </a>

        <!-- Step 5 -->
        <a href="#" class="onboarding-card" data-step="5">
          <div class="onboarding-step-indicator">
            <div class="onboarding-step-number">5</div>
            <div class="onboarding-step-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </div>
          </div>
          <h2 class="onboarding-card-title">AIプラン生成</h2>
          <p class="onboarding-card-desc">集約したデータと目標に基づき、AIコーチに最適なトレーニングプランを作成させましょう。</p>
          <div class="onboarding-card-action">AIチャットへ ${icons.chevronRight}</div>
        </a>

        <!-- Step 6 -->
        <a href="#" class="onboarding-card" data-step="6">
          <div class="onboarding-step-indicator">
            <div class="onboarding-step-number">6</div>
            <div class="onboarding-step-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>
          <h2 class="onboarding-card-title">準備完了！</h2>
          <p class="onboarding-card-desc">すべて完了です！ダッシュボードでフィットネスの推移をトラッキングし、トレーニングを始めましょう。</p>
          <div class="onboarding-card-action">ダッシュボードへ ${icons.chevronRight}</div>
        </a>
      </div>
    </main>
  `;
}

export function initGuide() {
    // Determine completed steps based on local storage
    const hasIntervalsKey = !!localStorage.getItem('intervals_api_key');
    const hasGoals = !!localStorage.getItem('goal_race_name'); // simplified check

    const cards = document.querySelectorAll('.onboarding-card');
    cards.forEach(card => {
        const step = card.getAttribute('data-step');
        
        // Simple logic for showing "completed" state visually
        if (step === "1") card.classList.add('completed'); 
        if (step === "2" && hasIntervalsKey) card.classList.add('completed');
        if (step === "4" && hasGoals) card.classList.add('completed');
        
        card.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Dispatch navigation events based on step
            switch(step) {
                case "1":
                case "2":
                    document.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
                    break;
                case "3":
                    document.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
                    // Theoretically link to an external guide or show a modal
                    alert("Garmin連携ガイド: \nGarmin Connectから直接Intervalsへデータを送る設定をIntervals.icuのサイト上で行ってください。");
                    break;
                case "4":
                    document.dispatchEvent(new CustomEvent('navigate', { detail: 'goals' }));
                    break;
                case "5":
                    document.dispatchEvent(new CustomEvent('navigate', { detail: 'ai-chat' }));
                    break;
                case "6":
                    document.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }));
                    break;
            }
        });
    });
}
