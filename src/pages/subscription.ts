// Subscription page

import { renderSidebar, renderTopBar } from '../components/sidebar';
import { icons } from '../components/icons';

export function renderSubscription(): string {
    return `
    ${renderSidebar()}
    ${renderTopBar()}
    <main class="main-content main-content-with-topbar">
      <div class="page-header">
        <div>
          <h1 class="page-title">サブスクリプション</h1>
          <p class="page-subtitle">プランの比較と管理</p>
        </div>
      </div>

      <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 20px;">プラン比較</h2>

      <div class="plans-grid">
        <!-- Standard Plan -->
        <div class="plan-card">
          <div class="plan-badge">Coming Soon</div>
          <div class="plan-name">
            ${icons.zap}
            <span>Standard</span>
          </div>
          <div class="plan-price">
            <span class="plan-price-old">¥480</span>
            <span class="plan-price-discount">21%OFF</span>
            <div style="margin-top: 4px;">
              <span class="plan-price-value">¥380</span>
              <span class="plan-price-unit">/月</span>
            </div>
          </div>
          <ul class="plan-features">
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>AIチャット 週25回</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>メゾプラン生成 週4回 (うち深掘り解析1回)</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>マクロプラン生成 月2回 (標準解析)</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>全アクティビティデータ同期</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>カレンダー表示</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>21日分の詳細データ分析</span>
            </li>
          </ul>
          <button class="plan-cta">
            ${icons.lock}
            <span>ベータ期間中は準備中</span>
          </button>
        </div>

        <!-- Advanced Plan -->
        <div class="plan-card">
          <div class="plan-badge">Coming Soon</div>
          <div class="plan-name">
            ${icons.bike}
            <span>Advanced</span>
          </div>
          <div class="plan-price">
            <div>
              <span class="plan-price-value">¥780</span>
              <span class="plan-price-unit">/月</span>
            </div>
          </div>
          <ul class="plan-features">
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>AIチャット 週60回</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>メゾプラン生成 週7回 (うち深掘り解析2回)</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>マクロプラン生成 月4回 (うちエキスパート解析1回)</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>全アクティビティデータ同期</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>カレンダー表示</span>
            </li>
            <li class="plan-feature">
              <span class="plan-feature-check">${icons.check}</span>
              <span>42日分の詳細データ分析</span>
            </li>
          </ul>
          <button class="plan-cta">
            ${icons.lock}
            <span>ベータ期間中は準備中</span>
          </button>
        </div>
      </div>

      <!-- Add-on Section -->
      <div class="addon-section">
        <h2 class="addon-section-title">追加オプション（単発購入）</h2>
        <div class="addon-card">
          <div class="addon-header">
            <div style="display: flex; align-items: center;">
              <div class="addon-icon">
                <span style="font-size: 1.2rem;">🔮</span>
              </div>
              <div>
                <div class="addon-title">エキスパート解析チケット</div>
                <div class="addon-subtitle">1回きりの都度購入</div>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="addon-price">¥300</span>
              <span class="addon-price-unit"> / 1回分</span>
            </div>
          </div>
          <p class="addon-desc">GPTプロモデルを使用した、より精度の高いマクロプランの深掘り解析を1回実行できる使い切りチケットです。</p>
          <div class="addon-usage">
            <div class="addon-usage-title">🎫 チケットの使い方</div>
            <ul class="addon-usage-list">
              <li>購入後、アカウントにチケットが即時追加されます</li>
              <li>マクロプラン生成時に「エキスパート解析」を選択すると1枚消費</li>
              <li>チケットに有効期限はありません</li>
            </ul>
          </div>
          <button class="plan-cta">
            ${icons.lock}
            <span>明日の本リリースで解放予定</span>
          </button>
        </div>
      </div>

      <div class="banner" style="margin-top: 32px;">
        <span class="banner-emoji">🎉</span>
        <span>【プレリリース中】現在、UIとカレンダー機能を先行公開しています！ AIプラン生成（決済機能）は、明日3月9日 20:00に解放予定です。ぜひ今のうちに画面を触ってみてください！</span>
      </div>
    </main>
  `;
}

export function initSubscription() {
    // Subscription page doesn't need special initialization for the demo
}
