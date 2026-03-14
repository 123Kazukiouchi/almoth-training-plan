// Login page

import { icons } from '../components/icons';

export function renderLogin(): string {
    return `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <div class="login-logo-icon">
            ${icons.activity}
          </div>
          <h1 class="login-title">ログイン</h1>
          <p class="login-subtitle">Almoth TrainingPlan にサインイン</p>
        </div>
        
        <form class="login-form" id="login-form">
          <div class="form-group">
            <label class="form-label" for="email">メールアドレス</label>
            <input class="form-input" type="text" id="email" placeholder="your@email.com" value="i135103" />
          </div>
          
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="password">パスワード</label>
              <a class="form-link" href="#">パスワードをお忘れですか？</a>
            </div>
            <input class="form-input" type="password" id="password" placeholder="パスワードを入力" value="••••••••••••••••" />
          </div>
          
          <button type="submit" class="login-btn" id="login-btn">ログイン</button>
        </form>
        
        <div class="login-divider" style="margin-top: 24px;">または</div>
        
        <button class="google-btn" id="google-login-btn" style="margin-top: 16px;">
          ${icons.google}
          <span>Google でログイン</span>
        </button>
        
        <p class="login-footer">アカウントをお持ちでない方は <a href="#">新規登録</a></p>
        <p class="login-back">← トップページに戻る</p>
      </div>
    </div>
  `;
}

export function initLogin() {
    const form = document.getElementById('login-form');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        window.location.hash = '/dashboard';
    });

    const googleBtn = document.getElementById('google-login-btn');
    googleBtn?.addEventListener('click', () => {
        window.location.hash = '/dashboard';
    });
}
