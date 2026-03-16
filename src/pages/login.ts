import { icons } from '../components/icons';
import { loginWithEmail, signInWithGoogle, getCachedUser } from '../services/authService';

export function renderLogin(): string {
    const user = getCachedUser();
    
    const profileHtml = user ? `
        <div class="login-profiles" style="margin-bottom: 24px;">
            <p class="login-subtitle" style="font-size: 0.8rem; margin-bottom: 12px;">最後に利用したアカウント</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="profile-btn" data-email="${user.email}" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); text-align: left; cursor: pointer; transition: all 0.2s;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                        ${user.email[0].toUpperCase()}
                    </div>
                    <span style="font-size: 0.9rem;">${user.email}</span>
                </button>
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
          
          ${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `
            <div style="margin-top: 12px; padding: 10px; background: rgba(255, 193, 7, 0.15); border: 1px solid #ffc107; border-radius: var(--radius-sm); color: #856404; font-size: 0.75rem; text-align: left;">
              ⚠️ 現在ローカル(localhost)で実行中です。ここから送信されるログインリンクはスマホでは開きません。スマホで同期する場合は <b>VercelのURL</b> から送信してください。
            </div>
          ` : ''}
        </div>
        
        <div id="login-feedback" style="display: none; margin-bottom: 16px; padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem; line-height: 1.5;"></div>

        ${profileHtml}

        <form class="login-form" id="login-form">
          <div class="form-group">
            <label class="form-label" for="email">メールアドレス</label>
            <input class="form-input" type="email" id="email" placeholder="your@email.com" required />
          </div>
          
          <button type="submit" class="login-btn" id="login-btn" style="width: 100%; margin-top: 12px;">ログインリンクを送信</button>
          <p style="font-size: 0.70rem; color: var(--color-text-muted); text-align: center; margin-top: 12px;">
            パスワードは不要です。メールに届くログインリンクをクリックしてください。
          </p>
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
    const feedback = document.getElementById('login-feedback');
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('email') as HTMLInputElement).value;
        if (email && feedback && loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerText = '送信中...';
            
            const { error } = await loginWithEmail(email);
            
            if (error) {
                feedback.style.display = 'block';
                feedback.style.background = 'var(--color-danger-bg)';
                feedback.style.color = 'var(--color-danger)';
                feedback.innerText = 'エラーが発生しました: ' + error.message;
                loginBtn.disabled = false;
                loginBtn.innerText = 'ログインリンクを送信';
            } else {
                feedback.style.display = 'block';
                feedback.style.background = 'var(--color-success-bg)';
                feedback.style.color = 'var(--color-success)';
                feedback.innerText = '確認メールを送信しました。メール内のリンクをクリックしてログインしてください。';
                form.style.display = 'none';
            }
        }
    });

    document.querySelectorAll('.profile-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const email = (btn as HTMLElement).dataset.email;
            if (email) {
                const { error } = await loginWithEmail(email);
                if (!error) {
                    if (feedback) {
                        feedback.style.display = 'block';
                        feedback.style.background = 'var(--color-success-bg)';
                        feedback.style.color = 'var(--color-success)';
                        feedback.innerText = '確認メールを送信しました。件名をご確認ください。';
                    }
                }
            }
        });
    });

    const googleBtn = document.getElementById('google-login-btn');
    googleBtn?.addEventListener('click', async () => {
        const { error } = await signInWithGoogle();
        if (error) alert('Googleログインエラー: ' + error.message);
    });
}
