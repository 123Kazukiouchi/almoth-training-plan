import { icons } from '../components/icons';
import { login, getProfiles } from '../services/authService';
// import type { UserProfile } from '../services/authService'; 


export function renderLogin(): string {
    const profiles = getProfiles();
    
    const profileHtml = profiles.length > 0 ? `
        <div class="login-profiles" style="margin-bottom: 24px;">
            <p class="login-subtitle" style="font-size: 0.8rem; margin-bottom: 12px;">最近のログイン</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${profiles.map(p => `
                    <button class="profile-btn" data-email="${p.email}" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); text-align: left; cursor: pointer; transition: all 0.2s;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                            ${p.email[0].toUpperCase()}
                        </div>
                        <span style="font-size: 0.9rem;">${p.email}</span>
                    </button>
                `).join('')}
            </div>
            <div class="login-divider" style="margin: 24px 0;">または</div>
        </div>
    ` : '';

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
        
        ${profileHtml}

        <form class="login-form" id="login-form">
          <div class="form-group">
            <label class="form-label" for="email">メールアドレス</label>
            <input class="form-input" type="email" id="email" placeholder="your@email.com" required />
          </div>
          
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label" for="password">パスワード</label>
            </div>
            <input class="form-input" type="password" id="password" placeholder="パスワードを入力" />
          </div>
          
          <button type="submit" class="login-btn" id="login-btn" style="width: 100%;">ログイン</button>
        </form>
        
        <div class="login-divider" style="margin-top: 24px;">または</div>
        
        <button class="google-btn" id="google-login-btn" style="margin-top: 16px;">
          ${icons.google}
          <span>Google でログイン</span>
        </button>
      </div>
    </div>
  `;
}

export function initLogin() {
    const form = document.getElementById('login-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (document.getElementById('email') as HTMLInputElement).value;
        if (email) {
            login(email);
            window.location.hash = '/dashboard';
        }
    });

    document.querySelectorAll('.profile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const email = (btn as HTMLElement).dataset.email;
            if (email) {
                login(email);
                window.location.hash = '/dashboard';
            }
        });
    });

    const googleBtn = document.getElementById('google-login-btn');
    googleBtn?.addEventListener('click', () => {
        login('google-user@example.com');
        window.location.hash = '/dashboard';
    });
}
