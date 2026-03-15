// Settings page

import { renderSidebar, renderTopBar } from '../components/sidebar';
import { icons } from '../components/icons';
import { storage } from '../utils/storage';
import { syncIntervalsData } from '../services/intervalsSync';
import { logout, getCachedUser } from '../services/authService';

export function renderSettings(): string {
  const user = getCachedUser();
  const email = user?.email || 'guest@example.com';
  const displayName = email.split('@')[0].toUpperCase();

  return `
    ${renderSidebar()}
    ${renderTopBar()}
    <main class="main-content main-content-with-topbar">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">${icons.settings}</div>
          <div>
            <h1 class="page-title">設定</h1>
            <p class="page-subtitle">アカウントと接続の管理</p>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section-title">プロフィール設定</h2>
        <div class="card">
          <div class="settings-form">
            <div class="form-group">
                <label class="form-label">同期用アカウント (読取専用)</label>
                <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--color-primary-bg); border-radius: var(--radius-sm); border: 1px solid var(--color-primary-light);">
                    <span style="color: var(--color-primary);">${icons.activity}</span>
                    <span style="font-weight: 600; color: var(--color-text-primary);">${storage.getItem('user_email') || email}</span>
                    <span style="font-size: 0.7rem; background: var(--color-primary); color: white; padding: 2px 6px; border-radius: 4px; margin-left: auto;">認証済</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">※ ログイン時のメールアドレスが自動的に連携されます。変更する場合は一度ログアウトしてください。</p>
            </div>
            <div class="form-group">
              <label class="form-label">表示名 (自動)</label>
              <input class="form-input" type="text" value="${displayName}" disabled />
            </div>
            <div class="form-group">
              <label class="form-label">体重 (kg)</label>
              <input class="form-input" type="number" id="input-weight" placeholder="例: 65" step="0.1" />
            </div>
            <div class="form-group">
              <label class="form-label">FTP (W)</label>
              <input class="form-input" type="number" id="input-ftp" placeholder="例: 220" />
            </div>
            <div class="form-group">
              <label class="form-label">最大心拍数</label>
              <input class="form-input" type="number" id="input-max-hr" placeholder="例: 190" />
            </div>
          </div>
          <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
            <button class="btn btn-primary" id="btn-save-profile">保存</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section-title">接続設定</h2>
        <div class="card">
          <div style="padding: 16px 0; border-bottom: 1px solid var(--color-border-light);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; background: var(--color-primary-bg); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;">
                  ${icons.sync}
                </div>
                <div>
                  <div style="font-weight: 600;">Intervals.icu</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted);">トレーニングデータの同期</div>
                </div>
              </div>
            </div>
            <div class="settings-form" style="margin-top: 10px;">
              <div class="form-group">
                <label class="form-label">アスリートID (Athlete ID)</label>
                <input class="form-input" type="text" id="intervals-athlete-id" placeholder="例: i135103" />
              </div>
              <div class="form-group">
                <label class="form-label">APIキー (API Key)</label>
                <input class="form-input" type="password" id="intervals-api-key" placeholder="APIキーを入力" />
              </div>
              <div class="form-group" style="margin-top: 10px;">
                <label class="form-label">許可するデータソース (任意)</label>
                <input class="form-input" type="text" id="intervals-valid-sources" placeholder="例: Garmin, Zwift" />
                <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 4px;">
                  指定した文字（一部一致可）を含むデバイス/ソース名のアクティビティのみを表示します。空欄の場合はすべて表示。
                </div>
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 8px;">
                ※ Garminを使用している場合、Intervals.icu側でGarmin連携を有効化することで、このアプリにも自動的にGarminのデータが同期されます。
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                <button class="btn btn-primary" id="btn-save-intervals">
                  <span>保存して接続確認</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section-title">ウェイトトレーニング (Hevy)</h2>
        <div class="card">
          <div style="padding: 16px 0; border-bottom: 1px solid var(--color-border-light);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; background: var(--color-primary-bg); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                  🏋️
                </div>
                <div>
                  <div style="font-weight: 600;">Hevy API</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted);">筋トレデータのカレンダー同期</div>
                </div>
              </div>
            </div>
            <div class="settings-form" style="margin-top: 10px;">
              <div class="form-group full-width">
                <label class="form-label">APIキー</label>
                <input class="form-input" type="password" id="hevy-api-key" placeholder="HevyのWeb設定から取得したAPIキー" />
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 4px; grid-column: 1 / -1;">
                ※ APIが設定されている場合、ダッシュボードとカレンダーに筋トレの履歴が自動で表示されます。
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; grid-column: 1 / -1;">
                <button class="btn btn-primary" id="btn-save-hevy">
                  <span>保存</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section-title">AI コーチ設定</h2>
        <div class="card">
          <div style="padding: 16px 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; background: var(--color-primary-bg); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                  ${icons.chat}
                </div>
                <div>
                  <div style="font-weight: 600;">Gemini API (Google)</div>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted);">チャットでのパーソナルデータ分析を利用</div>
                </div>
              </div>
            </div>
            <div class="settings-form" style="margin-top: 10px;">
              <div class="form-group full-width">
                <label class="form-label">Gemini APIキー</label>
                <div style="display: flex; gap: 8px;">
                   <input class="form-input" style="flex: 1;" type="password" id="gemini-api-key" placeholder="Google AI Studioで作成したAPIキー" />
                   <button class="btn btn-outline" id="btn-fetch-models">モデルを取得</button>
                </div>
              </div>
              <div class="form-group full-width">
                <label class="form-label">使用モデル</label>
                <select class="form-input" id="gemini-model-select">
                   <option value="gemini-1.5-flash">gemini-1.5-flash (デフォルト)</option>
                   <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                   <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                </select>
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 4px; grid-column: 1 / -1;">
                ※ Intervalsから取得したデータをAIに解析させるために必要です。キーを入力して「モデルを取得」を押すと、利用可能なモデル一覧を再取得できます。
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; grid-column: 1 / -1;">
                <button class="btn btn-primary" id="btn-save-ai">
                  <span>保存</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="settings-section-title">アカウント</h2>
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid var(--color-border-light); margin-bottom: 16px;">
            <div>
              <div style="font-weight: 600;">クラウド同期設定</div>
              <div id="sync-status" style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 4px;">最終同期: ---</div>
              <div id="sync-error" style="font-size: 0.8rem; color: var(--color-danger); display: none; margin-top: 4px;"></div>
            </div>
            <button class="btn btn-outline btn-sm" id="btn-force-pull">
                ${icons.sync} 今すぐ同期 (クラウドから取得)
            </button>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid var(--color-border-light); margin-bottom: 16px;">
            <div>
              <div style="font-weight: 600;">ログアウト</div>
              <div style="font-size: 0.8rem; color: var(--color-text-muted);">現在のアカウントからサインアウトします</div>
            </div>
            <button class="btn btn-outline" id="btn-logout-settings" style="color: var(--color-danger); border-color: var(--color-danger);">ログアウト</button>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; color: var(--color-danger);">アカウントを削除</div>
              <div style="font-size: 0.8rem; color: var(--color-text-muted);">すべてのデータが完全に削除されます</div>
            </div>
            <button class="btn btn-danger" id="btn-delete-account">削除</button>
          </div>
        </div>
      </div>
    </main>
  `;
}

export function initSettings() {
  // Load profile data
  const weightInput = document.getElementById('input-weight') as HTMLInputElement;
  const ftpInput = document.getElementById('input-ftp') as HTMLInputElement;
  const maxHrInput = document.getElementById('input-max-hr') as HTMLInputElement;

  if (weightInput) weightInput.value = storage.getItem('user_weight') || '68';
  if (ftpInput) ftpInput.value = storage.getItem('user_ftp') || '211';
  if (maxHrInput) maxHrInput.value = storage.getItem('user_max_hr') || '190';

  // Profile save logic
  document.getElementById('btn-save-profile')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-save-profile');
    if (weightInput) storage.setItem('user_weight', weightInput.value);
    if (ftpInput) storage.setItem('user_ftp', ftpInput.value);
    if (maxHrInput) storage.setItem('user_max_hr', maxHrInput.value);

    if (btn) {
      btn.textContent = '保存しました ✓';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline');
      setTimeout(() => {
        btn.textContent = '保存';
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-outline');
      }, 2000);
    }
  });

  // Load initial settings
  const athleteIdInput = document.getElementById('intervals-athlete-id') as HTMLInputElement;
  const apiKeyInput = document.getElementById('intervals-api-key') as HTMLInputElement;
  const validSourcesInput = document.getElementById('intervals-valid-sources') as HTMLInputElement;

  if (athleteIdInput) {
    athleteIdInput.value = storage.getItem('intervals_athlete_id') || '';
  }
  if (apiKeyInput) {
    apiKeyInput.value = storage.getItem('intervals_api_key') || '';
  }
  if (validSourcesInput) {
    validSourcesInput.value = storage.getItem('valid_activity_sources') || '';
  }

  // Intervals Connection Save
  document.getElementById('btn-save-intervals')?.addEventListener('click', async () => {
    if (athleteIdInput && apiKeyInput) {
      const athleteId = athleteIdInput.value.trim();
      const apiKey = apiKeyInput.value.trim();
      const validSources = validSourcesInput ? validSourcesInput.value.trim() : '';

      if (!athleteId || !apiKey) {
        alert('アスリートIDとAPIキーを入力してください。');
        return;
      }

      storage.setItem('intervals_athlete_id', athleteId);
      storage.setItem('intervals_api_key', apiKey);
      storage.setItem('valid_activity_sources', validSources);

      const btn = document.getElementById('btn-save-intervals') as HTMLButtonElement;
      if (!btn) return;

      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="animate-spin" style="animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
        </svg>
        <span>接続テスト中...</span>
      `;

      try {
        const success = await syncIntervalsData();
        if (success) {
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>接続・データ同期成功</span>
          `;
          btn.style.backgroundColor = 'var(--color-success)';
          btn.style.borderColor = 'var(--color-success)';
          btn.style.color = 'white';

          // プロフィールセクションの入力を最新値で上書きする
          const weightInput = document.getElementById('input-weight') as HTMLInputElement;
          const ftpInput = document.getElementById('input-ftp') as HTMLInputElement;
          const maxHrInput = document.getElementById('input-max-hr') as HTMLInputElement;
          if (weightInput) weightInput.value = storage.getItem('user_weight') || weightInput.value;
          if (ftpInput) ftpInput.value = storage.getItem('user_ftp') || ftpInput.value;
          if (maxHrInput) maxHrInput.value = storage.getItem('user_max_hr') || maxHrInput.value;

        } else {
          btn.innerHTML = `<span>データなし</span>`;
        }
      } catch (error: any) {
        btn.innerHTML = `<span>失敗: ${error.message || '認証エラー'}</span>`;
        btn.style.backgroundColor = 'var(--color-danger)';
        btn.style.borderColor = 'var(--color-danger)';
        btn.style.color = 'white';

        // Remove invalid credentials
        storage.removeItem('intervals_api_key');
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          btn.style.backgroundColor = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 4000);
      }
    }
  });

  // Hevy Settings
  const hevyApiKeyInput = document.getElementById('hevy-api-key') as HTMLInputElement;
  if (hevyApiKeyInput) {
    hevyApiKeyInput.value = storage.getItem('hevy_api_key') || '';
  }

  document.getElementById('btn-save-hevy')?.addEventListener('click', () => {
    if (hevyApiKeyInput) {
      storage.setItem('hevy_api_key', hevyApiKeyInput.value.trim());
      const btn = document.getElementById('btn-save-hevy') as HTMLButtonElement;
      if (btn) {
        btn.textContent = '保存しました ✓';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
        setTimeout(() => {
          btn.innerHTML = '<span>保存</span>';
          btn.classList.add('btn-primary');
          btn.classList.remove('btn-outline');
        }, 2000);
      }
    }
  });

  // AI settings
  const geminiKeyInput = document.getElementById('gemini-api-key') as HTMLInputElement;
  const geminiModelSelect = document.getElementById('gemini-model-select') as HTMLSelectElement;

  if (geminiKeyInput) {
    geminiKeyInput.value = storage.getItem('gemini_api_key') || '';
  }

  if (geminiModelSelect) {
      const savedModel = storage.getItem('gemini_model');
      if (savedModel) {
          // Add to options if not present
          if (!Array.from(geminiModelSelect.options).some(opt => opt.value === savedModel)) {
              const opt = document.createElement('option');
              opt.value = savedModel;
              opt.textContent = savedModel;
              geminiModelSelect.appendChild(opt);
          }
          geminiModelSelect.value = savedModel;
      }
  }

  document.getElementById('btn-fetch-models')?.addEventListener('click', async () => {
       const key = geminiKeyInput?.value.trim();
       if (!key) {
           alert('APIキーを入力してください');
           return;
       }
       const btn = document.getElementById('btn-fetch-models') as HTMLButtonElement;
       if (btn) {
           btn.textContent = "取得中...";
           btn.disabled = true;
       }

       try {
           const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
           if (!res.ok) throw new Error("APIキーが無効か通信エラーです");
           const data = await res.json();
           
           if (data.models && geminiModelSelect) {
               geminiModelSelect.innerHTML = '';
               // Filter for generateContent supported models
               const chatModels = data.models.filter((m: any) => m.supportedGenerationMethods.includes('generateContent'));
               chatModels.forEach((m: any) => {
                   const opt = document.createElement('option');
                   const modelName = m.name.replace('models/', '');
                   opt.value = modelName;
                   opt.textContent = `${m.displayName} (${modelName})`;
                   geminiModelSelect.appendChild(opt);
               });
               
               // Attempt to restore selection
               const current = storage.getItem('gemini_model') || 'gemini-1.5-flash';
               if (Array.from(geminiModelSelect.options).some(opt => opt.value === current)) {
                   geminiModelSelect.value = current;
               }
           }
           if (btn) btn.textContent = "取得完了";
       } catch (e: any) {
           alert("モデル一覧の取得に失敗しました: " + e.message);
           if (btn) btn.textContent = "モデルを取得";
       } finally {
           if (btn) {
               setTimeout(() => { btn.textContent = "モデルを取得"; btn.disabled = false; }, 2000);
           }
       }
  });

  document.getElementById('btn-save-ai')?.addEventListener('click', () => {
    if (geminiKeyInput && geminiModelSelect) {
        storage.setItem('gemini_api_key', geminiKeyInput.value.trim());
        storage.setItem('gemini_model', geminiModelSelect.value);
        const btn = document.getElementById('btn-save-ai') as HTMLButtonElement;
        if (btn) {
            btn.textContent = '保存しました ✓';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline');
            setTimeout(() => {
                btn.innerHTML = '<span>保存</span>';
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-outline');
            }, 2000);
        }
    }
  });

  // Logout from settings
  document.getElementById('btn-logout-settings')?.addEventListener('click', () => {
    if (confirm('ログアウトしますか？')) {
      logout();
    }
  });

  // Cloud Sync Diagnostics
  const syncStatusEl = document.getElementById('sync-status');
  const syncErrorEl = document.getElementById('sync-error');
  const forcePullBtn = document.getElementById('btn-force-pull');

  const updateSyncUI = async () => {
      const lastSync = storage.getItem('_last_sync_time');
      if (syncStatusEl) {
          syncStatusEl.textContent = lastSync ? `最終同期: ${new Date(parseInt(lastSync)).toLocaleString()}` : '未同期';
      }
  };

  updateSyncUI();

  forcePullBtn?.addEventListener('click', async () => {
      if (forcePullBtn instanceof HTMLButtonElement) {
          forcePullBtn.disabled = true;
          const original = forcePullBtn.innerHTML;
          forcePullBtn.innerHTML = `<span>同期中...</span>`;
          
          try {
              const result = await (storage as any).pullAll();
              if (result && result.error) throw result.error;
              if (syncErrorEl) syncErrorEl.style.display = 'none';
              storage.setItem('_last_sync_time', Date.now().toString());
              updateSyncUI();
              alert('同期が完了しました。');
              window.location.reload(); // Refresh to ensure all data is active
          } catch (e: any) {
              if (syncErrorEl) {
                  syncErrorEl.textContent = `同期エラー: ${e.message || '通信失敗'}`;
                  syncErrorEl.style.display = 'block';
              }
          } finally {
              forcePullBtn.innerHTML = original;
              forcePullBtn.disabled = false;
          }
      }
  });
}
