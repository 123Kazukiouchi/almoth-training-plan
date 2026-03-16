// Training Plans page with AI Plan Generator

import { renderSidebar, renderTopBar } from '../components/sidebar';
import { icons } from '../components/icons';
import { storage } from '../utils/storage';
import { generateAiResponse, resetConversation } from '../services/aiService';

// Sample plan templates shown to the user for inspiration
const PLAN_EXAMPLES = [
  { icon: '⚡', title: 'FTP向上 8週間', desc: '閾値走・インターバルを組み合わせてFTPを5〜10%改善', color: '#F59E0B', tags: ['中〜上級', '週5時間〜'] },
  { icon: '🏔️', title: 'レース準備 12週間', desc: 'ベース→ビルド→ピーク→テーパーの完全サイクル', color: '#3B82F6', tags: ['目標レース向け', '週7時間〜'] },
  { icon: '🟢', title: 'ベースフィットネス 4週間', desc: 'Z2中心で有酸素基盤を構築するリカバリー向けプラン', color: '#10B981', tags: ['初心者・回復期', '週3時間〜'] },
  { icon: '🚴', title: 'ヒルクライム強化 8週間', desc: 'VO2maxとクライミング効率を改善するスペシャライズドプラン', color: '#8B5CF6', tags: ['クライマー向け', '週6時間〜'] },
];

export function renderPlans(): string {
  return `
    ${renderSidebar()}
    ${renderTopBar()}
    <main class="main-content main-content-with-topbar">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">${icons.clipboard}</div>
          <div>
            <h1 class="page-title">トレーニングプラン</h1>
            <p class="page-subtitle">AIがあなたのデータをもとに最適プランを生成</p>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-create-plan">
            ${icons.plus}
            <span>プランを生成</span>
          </button>
        </div>
      </div>

      <!-- サンプルプランカード（プランがない時に表示） -->
      <div id="plan-examples-section">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
          <h2 style="font-size:1rem; font-weight:700; color:var(--color-text-primary);">プランの例</h2>
          <span style="font-size:0.8rem; color:var(--color-text-muted);">— 以下のようなプランをAIが生成します</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:var(--space-5); margin-bottom:var(--space-8);">
          ${PLAN_EXAMPLES.map(p => `
            <div style="
              background: rgba(255,255,255,0.7);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255,255,255,0.5);
              border-radius: var(--radius-lg);
              padding: var(--space-5);
              border-left: 4px solid ${p.color};
              transition: all 0.25s ease;
              cursor: pointer;
            " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-lg)'"
               onmouseout="this.style.transform='';this.style.boxShadow=''"
               onclick="document.getElementById('btn-create-plan').click()"
            >
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                <div style="font-size:1.8rem;">${p.icon}</div>
                <div style="font-weight:700; font-size:1rem;">${p.title}</div>
              </div>
              <p style="font-size:0.85rem; color:var(--color-text-secondary); margin-bottom:10px; line-height:1.5;">${p.desc}</p>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${p.tags.map(t => `<span style="font-size:0.7rem; padding:2px 8px; background:${p.color}22; color:${p.color}; border-radius:var(--radius-full); font-weight:600;">${t}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 生成されたプランのリスト -->
      <div id="plans-list" style="display:none;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-5);">
          <h2 style="font-size:1rem; font-weight:700;">生成されたプラン</h2>
          <button class="btn btn-outline btn-sm" id="btn-clear-plans">クリア</button>
        </div>
        <div id="plans-cards-container"></div>
      </div>

      <!-- プラン生成モーダル -->
      <div class="modal-overlay" id="plan-modal" style="display:none;">
        <div class="modal" style="max-width:600px; width:95%;">
          <!-- ウィザードステップ表示 -->
          <div id="plan-wizard">
            <!-- Step 1: 概要 -->
            <div id="wizard-step-1">
              <h2 class="modal-title">🤖 AIトレーニングプラン生成</h2>
              <div style="background:var(--color-primary-bg); border-radius:var(--radius-md); padding:12px 16px; margin-bottom:20px; font-size:0.85rem; color:var(--color-text-secondary);">
                あなたの <strong>Intervals.icu データ・コンディション・目標</strong> をAIが分析して、
                週ごとの具体的なトレーニングメニューを生成します。
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">関連付ける目標（任意）</label>
                  <select class="form-input" id="plan-linked-goal">
                    <option value="">-- 目標を選択しない --</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">プランのメイン目的</label>
                  <select class="form-input" id="plan-goal-type">
                    <option value="ftp">⚡ FTP向上</option>
                    <option value="race">🏔️ レース準備</option>
                    <option value="base">🟢 ベース構築 / 回復</option>
                    <option value="climbing">🚴 ヒルクライム強化</option>
                    <option value="vo2max">🔴 VO2max向上</option>
                    <option value="weight">⚖️ 減量 + フィットネス</option>
                    <option value="custom">✏️ カスタム</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">プラン期間</label>
                  <select class="form-input" id="plan-duration">
                    <option value="4">4週間</option>
                    <option value="6">6週間</option>
                    <option value="8" selected>8週間（推奨）</option>
                    <option value="12">12週間</option>
                    <option value="16">16週間</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">週あたりのトレーニング可能時間</label>
                  <select class="form-input" id="plan-weekly-hours">
                    <option value="3">〜3時間（週2〜3回）</option>
                    <option value="5" selected>〜5時間（週3〜4回）</option>
                    <option value="8">〜8時間（週4〜5回）</option>
                    <option value="12">〜12時間（週5〜6回）</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">現在の体力レベル</label>
                  <select class="form-input" id="plan-level">
                    <option value="beginner">初心者（運動再開・週1〜2回）</option>
                    <option value="intermediate" selected>中級（週3〜4回・CTL 30〜60）</option>
                    <option value="advanced">上級（週5回以上・CTL60+）</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">ロードバイク (週何回)</label>
                  <select class="form-input" id="plan-bike-freq">
                    <option value="none" selected>指定なし</option>
                    <option value="1">週1回</option>
                    <option value="2">週2回</option>
                    <option value="3">週3回</option>
                    <option value="4">週4回</option>
                    <option value="5">週5回</option>
                    <option value="6">週6回</option>
                    <option value="7">週7回</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">ウェイトトレーニング (週何回)</label>
                  <select class="form-input" id="plan-weight-freq">
                    <option value="none">指定なし</option>
                    <option value="0">0回 (なし)</option>
                    <option value="1">週1回</option>
                    <option value="2" selected>週2回</option>
                    <option value="3">週3回</option>
                    <option value="4">週4回</option>
                  </select>
                </div>
              </div>
              <div class="form-group" style="margin-top:8px;">
                <label class="form-label">ターゲット / 具体的な希望（任意）</label>
                <textarea class="form-input" id="plan-extra" rows="2" placeholder="例: 6月の富士ヒルに向けて、現在のCTLは45程度。特に登坂力を上げたい。"></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-outline" id="cancel-plan-modal">キャンセル</button>
                <button type="button" class="btn btn-primary" id="btn-generate-plan">
                  ${icons.chat}
                  <span>AIでプラン生成</span>
                </button>
              </div>
            </div>

            <!-- Step 2: 生成中 -->
            <div id="wizard-step-2" style="display:none; text-align:center; padding:40px 20px;">
              <div style="margin-bottom:24px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5" style="animation: spin 1s linear infinite;">
                  <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
                </svg>
              </div>
              <div style="font-size:1.1rem; font-weight:700; margin-bottom:8px;">AIがプランを生成中...</div>
              <p id="plan-gen-status" style="color:var(--color-text-muted); font-size:0.9rem;">Intervalsのデータを分析しています</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}

/** 目標の期間から残り週数を計算 */
function calcWeeksFromGoal(goal: any): number | null {
  if (!goal.period || goal.period === '未設定') return null;
  const today = new Date();

  if (goal.type === 'race') {
    // race の period はレース日 "YYYY-MM-DD"
    const raceDate = new Date(goal.period);
    if (isNaN(raceDate.getTime())) return null;
    const weeks = Math.round((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return weeks > 0 ? weeks : null;
  } else {
    // period: "YYYY-MM-DD 〜 YYYY-MM-DD"
    const parts = goal.period.split('〜').map((s: string) => s.trim());
    if (parts.length !== 2) return null;
    const start = new Date(parts[0]);
    const end = new Date(parts[1]);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
  }
}

/** 目標オブジェクトからプランモーダルのフィールドを自動埋め */
function fillFromGoal(goal: any) {
  if (!goal) return;

  // 目的タイプのマッピング
  const typeMap: Record<string, string> = { ftp: 'ftp', race: 'race', profile: 'climbing', weight: 'weight', other: 'custom' };
  const goalTypeEl = document.getElementById('plan-goal-type') as HTMLSelectElement;
  if (goalTypeEl && typeMap[goal.type]) goalTypeEl.value = typeMap[goal.type];

  // 期間を自動選択（最近接の選択肢）
  const weeks = calcWeeksFromGoal(goal);
  if (weeks) {
    const durationEl = document.getElementById('plan-duration') as HTMLSelectElement;
    if (durationEl) {
      const options = [4, 6, 8, 12, 16];
      const closest = options.reduce((prev, curr) => Math.abs(curr - weeks) < Math.abs(prev - weeks) ? curr : prev);
      durationEl.value = closest.toString();
    }
  }

  // 追加情報テキストエリアに目標詳細を自動挿入
  const extraEl = document.getElementById('plan-extra') as HTMLTextAreaElement;
  if (extraEl) {
    let lines = [`目標: ${goal.name}`];
    if (goal.target) lines.push(`目標値: ${goal.target}`);
    if (goal.period && goal.period !== '未設定') lines.push(`期間: ${goal.period}`);
    if (weeks) lines.push(`残り期間: 約${weeks}週間`);
    if (goal.memo) lines.push(`備考: ${goal.memo}`);
    extraEl.value = lines.join('\n');
  }
}

/** モーダルを開いて目標を指定IDで選択し、フィールドを連動 */
function openPlanModal(targetGoalId?: string) {
  const modal = document.getElementById('plan-modal');
  const goalsSelect = document.getElementById('plan-linked-goal') as HTMLSelectElement;
  const savedGoals = JSON.parse(storage.getItem('user_goals') || '[]');
  const activeGoalId = storage.getItem('active_goal_id');

  if (goalsSelect) {
    goalsSelect.innerHTML = '<option value="">-- 目標を選択しない --</option>' +
      savedGoals.map((g: any, i: number) => `<option value="${i}">${g.name} (${g.period})</option>`).join('');

    // 指定 or アクティブ目標を選択
    const selectId = targetGoalId || activeGoalId;
    if (selectId) {
      const idx = savedGoals.findIndex((g: any) => g.id === selectId);
      if (idx !== -1) {
        goalsSelect.value = idx.toString();
        fillFromGoal(savedGoals[idx]);
      }
    }
  }

  if (modal) modal.style.display = 'flex';
  showWizardStep(1);
}

export function initPlans() {
  const modal = document.getElementById('plan-modal');

  // 目標ページからの連携: sessionStorageに pending_goal_id があれば自動でモーダルを開く
  const pendingGoalId = sessionStorage.getItem('pending_goal_id');
  if (pendingGoalId) {
    sessionStorage.removeItem('pending_goal_id');
    setTimeout(() => openPlanModal(pendingGoalId), 50);
  }

  document.getElementById('btn-create-plan')?.addEventListener('click', () => openPlanModal());

  // 目標選択が変わったときにフィールドを連動
  document.getElementById('plan-linked-goal')?.addEventListener('change', () => {
    const goalsSelect = document.getElementById('plan-linked-goal') as HTMLSelectElement;
    const savedGoals = JSON.parse(storage.getItem('user_goals') || '[]');
    const idx = parseInt(goalsSelect.value, 10);
    if (!isNaN(idx) && savedGoals[idx]) {
      fillFromGoal(savedGoals[idx]);
    }
  });

  document.getElementById('cancel-plan-modal')?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  document.getElementById('btn-generate-plan')?.addEventListener('click', generatePlan);

  document.getElementById('btn-clear-plans')?.addEventListener('click', () => {
    const container = document.getElementById('plans-cards-container');
    if (container) container.innerHTML = '';
    document.getElementById('plans-list')!.style.display = 'none';
    document.getElementById('plan-examples-section')!.style.display = 'block';
    storage.removeItem('saved_plans');
  });

  // Restore saved plans from localStorage
  const savedPlans = storage.getItem('saved_plans');
  if (savedPlans) {
    try {
      const plans = JSON.parse(savedPlans) as { id?: string; title: string; content: string; date: string }[];
      if (plans.length > 0) {
        plans.forEach(p => renderPlanCard(p.id || Date.now().toString(), p.title, p.content, p.date, false));
        document.getElementById('plan-examples-section')!.style.display = 'none';
        document.getElementById('plans-list')!.style.display = 'block';
      }
    } catch {}
  }
}

function showWizardStep(step: number) {
  document.getElementById('wizard-step-1')!.style.display = step === 1 ? 'block' : 'none';
  document.getElementById('wizard-step-2')!.style.display = step === 2 ? 'block' : 'none';
}

async function generatePlan() {
  const linkedGoalIdx = (document.getElementById('plan-linked-goal') as HTMLSelectElement).value;
  const goalType = (document.getElementById('plan-goal-type') as HTMLSelectElement).value;
  const duration = (document.getElementById('plan-duration') as HTMLSelectElement).value;
  const weeklyHours = (document.getElementById('plan-weekly-hours') as HTMLSelectElement).value;
  const level = (document.getElementById('plan-level') as HTMLSelectElement).value;
  const bikeFreq = (document.getElementById('plan-bike-freq') as HTMLSelectElement).value;
  const weightFreq = (document.getElementById('plan-weight-freq') as HTMLSelectElement).value;
  const extra = (document.getElementById('plan-extra') as HTMLTextAreaElement).value;

  if (!storage.getItem('gemini_api_key')) {
    alert('設定画面からGemini APIキーを登録してください。');
    return;
  }

  // Get selected goal details
  let linkedGoalInfo = "";
  if (linkedGoalIdx !== "") {
    const savedGoals = JSON.parse(storage.getItem('user_goals') || '[]');
    const goal = savedGoals[parseInt(linkedGoalIdx)];
    if (goal) {
      const goalTypeLabels: Record<string, string> = { race: 'レース出場・完走', ftp: 'FTP向上', profile: '脚質強化', weight: '減量・フィットネス向上', other: 'トレーニングブロック' };
      const weeks = calcWeeksFromGoal(goal);
      linkedGoalInfo = [
        '【関連目標】',
        `- 目標名: ${goal.name}`,
        `- 目標タイプ: ${goalTypeLabels[goal.type] || goal.type}`,
        `- 設定期間: ${goal.period}`,
        weeks ? `- 今日から目標日まで: 約${weeks}週間` : '',
        goal.target ? `- 具体的な目標値: ${goal.target}` : '',
        goal.memo ? `- 目標へのメモ: ${goal.memo}` : '',
      ].filter(Boolean).join('\n') + '\n\n';
    }
  }

  const goalLabels: Record<string, string> = {
    ftp: 'FTP向上', race: 'レース準備', base: 'ベース構築・回復',
    climbing: 'ヒルクライム強化', vo2max: 'VO2max向上', weight: '減量+フィットネス', custom: 'カスタム'
  };
  const levelLabels: Record<string, string> = { beginner: '初心者', intermediate: '中級', advanced: '上級' };

  showWizardStep(2);

  const statusEl = document.getElementById('plan-gen-status');
  const messages = [
    'Intervalsのウェルネスデータを解析しています...',
    'アクティビティ履歴を分析中です...',
    'コンディションと目標を照合しています...',
    'トレーニング科学の原則に基づきプランを構成中...',
    'もうすぐ完成します...',
  ];
  let msgIdx = 0;
  const ticker = setInterval(() => {
    if (statusEl && msgIdx < messages.length) statusEl.textContent = messages[msgIdx++];
  }, 3000);

  // Build a structured prompt for plan generation
  const prompt = `
以下の条件でトレーニングプランを作成してください。

${linkedGoalInfo}
【プランの要件】
- 目的: ${goalLabels[goalType] || goalType}
- 期間: ${duration}週間
- 週あたりトレーニング時間: ${weeklyHours}時間以内
- 現在のレベル: ${levelLabels[level] || level}
- 週あたりの実施頻度の希望:
    - ロードバイク: ${bikeFreq === 'none' ? '指定なし（AIに任せる）' : `週${bikeFreq}回`}
    - ウェイトトレーニング: ${weightFreq === 'none' ? '指定なし（AIに任せる）' : `週${weightFreq}回`}
${extra ? `- 追加希望事項: ${extra}` : ''}
- ウェイトトレーニングを提案に含める場合、種目名だけでなく想定する重量やセット数・回数（例: スクワット 50kg x 10回 x 3セット）など、具体的な内容も記載してください。
- ロードバイクとウェイトトレーニングのバランスを考慮し、全体として過負荷になりすぎないように構成してください。
- いつも同じ種目ばかりにならないよう、新しいメニューやバリエーションも積極的に取り入れてください。

【出力形式】
必ず以下の構造で日本語で回答してください：

## プラン概要
（このプランの狙いと期待効果を2〜3行で）

## 週次構成（${duration}週間）
各週について以下の形式で記述：

### 第1週: [週のテーマ]
- **月**: [メニュー名] — [内容・時間・強度]
- **火**: レスト または [メニュー名] — [内容]
- **水**: [メニュー名] — [内容・時間・強度]
- **木**: レスト または [メニュー名] — [内容]
- **金**: [メニュー名] — [内容・時間・強度]
- **土**: [メニュー名] — [内容・時間・強度] ※週のロングライド
- **日**: レスト / アクティブリカバリー
- **週合計**: 約X時間 / 予想TSS: XXX

（残りの週も同様に記述）

## ポイントと注意事項
（プランを実行する上での重要なポイントを3〜5つ箇条書きで）
`;

  try {
    // Use a fesh conversation for plan generation
    resetConversation();
    const result = await generateAiResponse(prompt);
    clearInterval(ticker);

    // Save to localStorage
    const planId = Date.now().toString();
    const planTitle = `${goalLabels[goalType]} ${duration}週間プラン`;
    const planDate = new Date().toLocaleDateString('ja-JP');
    const saved = JSON.parse(storage.getItem('saved_plans') || '[]');
    saved.unshift({ id: planId, title: planTitle, content: result, date: planDate });
    storage.setItem('saved_plans', JSON.stringify(saved.slice(0, 10)));

    // Hide modal and show the plan card
    const modal = document.getElementById('plan-modal');
    if (modal) modal.style.display = 'none';
    
    document.getElementById('plan-examples-section')!.style.display = 'none';
    document.getElementById('plans-list')!.style.display = 'block';
    renderPlanCard(planId, planTitle, result, planDate, true);
  } catch (err: any) {
    clearInterval(ticker);
    const modal = document.getElementById('plan-modal');
    if (modal) modal.style.display = 'none';
    alert('プランの生成に失敗しました: ' + err.message);
  }
}

/**
 * Delete a plan from localStorage
 */
(window as any).deletePlan = (planId: string) => {
  if (!confirm('このプランを削除してもよろしいですか？')) return;
  
  const saved = JSON.parse(storage.getItem('saved_plans') || '[]');
  const filtered = saved.filter((p: any) => p.id !== planId && p.id !== undefined && p.id !== null); // safety
  // Also handle old plans without IDs by just clearing them if needed or finding by title (riskier)
  // For now, let's just filter by ID
  storage.setItem('saved_plans', JSON.stringify(filtered));
  
  const card = document.querySelector(`[data-plan-id="${planId}"]`);
  if (card) {
    card.remove();
  }
  
  if (filtered.length === 0) {
    document.getElementById('plans-list')!.style.display = 'none';
    document.getElementById('plan-examples-section')!.style.display = 'block';
  }
};

/**
 * Toggle plan body visibility
 */
(window as any).togglePlanBody = (planId: string) => {
  const card = document.querySelector(`[data-plan-id="${planId}"]`);
  if (!card) return;
  const body = card.querySelector('.plan-body') as HTMLElement;
  const btn = card.querySelector('.btn-toggle') as HTMLElement;
  if (!body || !btn) return;

  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? 'block' : 'none';
  btn.textContent = isHidden ? '折りたたむ' : '展開する';
};

/**
 * Edit plan (show textarea)
 */
(window as any).editPlan = (planId: string) => {
    const saved = JSON.parse(storage.getItem('saved_plans') || '[]');
    const plan = saved.find((p: any) => p.id === planId);
    if (!plan) return;

    const bodyEl = document.getElementById(`plan-body-${planId}`);
    const editEl = document.getElementById(`plan-edit-${planId}`);
    const textarea = document.getElementById(`plan-textarea-${planId}`) as HTMLTextAreaElement;

    if (bodyEl && editEl && textarea) {
        bodyEl.style.display = 'none';
        editEl.style.display = 'block';
        textarea.value = plan.content;
    }
};

/**
 * Cancel edit
 */
(window as any).cancelEditPlan = (planId: string) => {
    const bodyEl = document.getElementById(`plan-body-${planId}`);
    const editEl = document.getElementById(`plan-edit-${planId}`);
    if (bodyEl && editEl) {
        bodyEl.style.display = 'block';
        editEl.style.display = 'none';
    }
};

/**
 * Save edited plan
 */
(window as any).saveEditedPlan = (planId: string) => {
    const textarea = document.getElementById(`plan-textarea-${planId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const newContent = textarea.value;
    const saved = JSON.parse(storage.getItem('saved_plans') || '[]');
    const planIndex = saved.findIndex((p: any) => p.id === planId);
    if (planIndex !== -1) {
        saved[planIndex].content = newContent;
        storage.setItem('saved_plans', JSON.stringify(saved));
        
        // Re-render
        const cardContainer = document.getElementById('plans-cards-container');
        if (cardContainer) {
            initPlans(); // simple refresh
        }
    }
};

/**
 * Apply the plan to the calendar by parsing the text
 */
(window as any).applyPlanToCalendar = (planId: string) => {
  const savedPlans = JSON.parse(storage.getItem('saved_plans') || '[]');
  const plan = savedPlans.find((p: any) => p.id === planId);
  if (!plan) return;

  const startStr = prompt('いつからこのプランを開始しますか？\n(YYYY-MM-DD形式で入力。例: 2026-04-01)', new Date().toISOString().split('T')[0]);
  if (!startStr) return;

  const startDate = new Date(startStr);
  if (isNaN(startDate.getTime())) {
    alert('無効な日付形式です');
    return;
  }

  // Very basic parser for the generated plan structure
  // expects "### 第X週" and "- **月**: [メニュー名]..."
  const lines = plan.content.split('\n');
  const scheduled = JSON.parse(storage.getItem('scheduled_workouts') || '[]');
  
  let currentWeek = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^### 第\s*(\d+)\s*週/)) {
        const match = line.match(/^### 第\s*(\d+)\s*週/);
        currentWeek = parseInt(match![1], 10) - 1; // 0-indexed
    } else if (line.match(/^- \*\*(月|火|水|木|金|土|日)\*\*:/)) {
        const match = line.match(/^- \*\*(月|火|水|木|金|土|日)\*\*:\s*(.+)/);
        if (match && currentWeek >= 0) {
            const dayStr = match[1];
            const content = match[2];
            
            // Map Japanese day to offset (Monday = 0, Sunday = 6)
            const daysOffset: Record<string, number> = { '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5, '日': 6 };
            const offsetInfo = daysOffset[dayStr];
            
            if (offsetInfo !== undefined && !content.includes('レスト')) {
                // Calculate target date
                const targetDate = new Date(startDate);
                // Adjust for start date's day of week (assuming start date is the start of Week 1)
                // Simplify: just add (weeks * 7) + day_offset
                // Let's assume start date is a Monday for simplicity, or we just map relative to start date
                const startDayOffset = (startDate.getDay() + 6) % 7; // Monday = 0
                const daysToAdd = (currentWeek * 7) + (offsetInfo - startDayOffset);
                targetDate.setDate(targetDate.getDate() + daysToAdd);
                
                const targetDateStr = targetDate.toISOString().split('T')[0];
                
                // Parse title and details
                const parts = content.split(' — ');
                const title = parts[0].trim();
                const desc = parts.length > 1 ? parts[1].trim() : '';
                
                scheduled.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    date: targetDateStr,
                    title: title,
                    description: desc,
                    planId: planId
                });
            }
        }
    }
  }

  storage.setItem('scheduled_workouts', JSON.stringify(scheduled));
  alert(`カレンダーに ${scheduled.length} 件のトレーニング予定を適用しました！\nカレンダー画面に移動します。`);
  
  // Custom router redirect
  window.location.hash = '#/calendar';
};

/**
 * Renders a generated training plan as a formatted card
 */
function renderPlanCard(id: string, title: string, rawText: string, date: string, prepend: boolean) {
  const container = document.getElementById('plans-cards-container');
  if (!container) return;

  // Improved markdown → HTML
  let html = rawText
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:1.1rem;font-weight:700;margin:24px 0 12px;color:var(--color-text-primary);padding-left:10px;border-left:4px solid var(--color-primary);">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:1rem;font-weight:700;margin:18px 0 8px;color:var(--color-primary);border-bottom:1px solid var(--color-border-light);padding-bottom:6px;display:flex;align-items:center;gap:8px;">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--color-text-primary);">$1</strong>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:8px;list-style:none;display:flex;align-items:flex-start;gap:8px;"><span style="color:var(--color-primary);font-weight:bold;">•</span><span>$1</span></li>')
    .replace(/((<li.*<\/li>\n?)+)/g, '<ul style="padding-left:0;margin:12px 0;">$1</ul>')
    .replace(/\n/g, '<br>');

  const card = document.createElement('div');
  card.setAttribute('data-plan-id', id);
  card.style.cssText = 'background:var(--color-white);border:1px solid var(--color-border);border-radius:var(--radius-lg);margin-bottom:var(--space-6);overflow:hidden;box-shadow:var(--shadow-sm);';
  card.innerHTML = `
    <div style="padding:16px 20px;background:linear-gradient(135deg,var(--color-primary-bg),rgba(255,255,255,0));border-bottom:1px solid var(--color-border-light);display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:10px; height:10px; border-radius:50%; background:var(--color-primary);"></div>
        <div>
          <div style="font-weight:700;font-size:1.05rem;color:var(--color-text-primary);">${title}</div>
          <div style="font-size:0.78rem;color:var(--color-text-muted);margin-top:2px;">生成日: ${date}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm btn-calendar" onclick="applyPlanToCalendar('${id}')" title="カレンダーに適用">📅</button>
        <button class="btn btn-outline btn-sm" onclick="editPlan('${id}')">編集</button>
        <button class="btn btn-outline btn-sm btn-toggle" onclick="togglePlanBody('${id}')">折りたたむ</button>
        <button class="btn btn-danger-outline btn-sm" onclick="deletePlan('${id}')">${icons.trash || '削除'}</button>
      </div>
    </div>
    <div class="plan-body" id="plan-body-${id}" style="padding:24px 30px;font-size:0.95rem;line-height:1.8;color:var(--color-text-secondary);">${html}</div>
    <div class="plan-edit-area" id="plan-edit-${id}" style="display:none; padding:24px 30px; background:var(--color-bg);">
        <textarea id="plan-textarea-${id}" style="width:100%; height:300px; padding:12px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-family:monospace; resize:vertical; font-size: 0.9rem; line-height: 1.5;"></textarea>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top:12px;">
            <button class="btn btn-outline btn-sm" onclick="cancelEditPlan('${id}')">キャンセル</button>
            <button class="btn btn-primary btn-sm" onclick="saveEditedPlan('${id}')">保存</button>
        </div>
    </div>
  `;

  if (prepend && container.firstChild) {
    container.insertBefore(card, container.firstChild);
  } else {
    container.appendChild(card);
  }
}
