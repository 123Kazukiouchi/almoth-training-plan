// Goals page

import { renderSidebar, renderTopBar } from '../components/sidebar';
import { icons } from '../components/icons';
import { storage } from '../utils/storage';

// -------------------------------------------------------------------
// エビデンスに基づくトレーニング期間の定義
// 参考: Bompa & Haff "Periodization: Theory and Methodology of Training"
//       Seiler「ゾーン2トレーニングと低強度トレーニングの優位性」
//       Issurin "Block Periodization" 
// -------------------------------------------------------------------
const TRAINING_PERIODS = [
  {
    label: '4週間 (単発メゾサイクル) 🟢',
    weeks: 4,
    description: '短期集中型。特定のレース前や弱点を集中強化したい時に有効。',
    evidence: '文献では3〜4週間が最小単位の「メゾサイクル」として定義されており、特定のエネルギー系の適応に必要な期間とされる（Bompa & Haff, 2009）。'
  },
  {
    label: '6週間 (ブロック移行期) 🟢',
    weeks: 6,
    description: 'ベース → ビルドの切り替えや、大きな休暇・レース後の復帰に適切。',
    evidence: 'Issurinのブロック・ペリオダイゼーション理論では、集中した刺激を6週間維持することで遅延適応を引き出せると報告。'
  },
  {
    label: '8週間 (標準メゾサイクル) 🔵 推奨',
    weeks: 8,
    description: 'ベース構築や閾値向上に最もバランスの良い期間。'
        + '体力の基盤を作りながら疲労を管理できる。',
    evidence: '多くの競技科学論文(&lt;Seiler, 2010&gt;, &lt;Stöggl, 2014&gt;)で、持久系アスリートの適応には8週間前後が'
        + '最も高いCTL向上と体組成改善が見られると報告されている。'
  },
  {
    label: '12週間 (フルベースビルド) 🔵 推奨',
    weeks: 12,
    description: 'CTL（フィットネス）を大きく伸ばすための本格的な準備期間。FTP向上・レース準備に最適。',
    evidence: '持久系スポーツのコーチングで最も多用されるサイクル。'
        + 'CogganのトレーニングレベルモデルでもCTLが安定して上昇する期間として12週をベースとしている。'
  },
  {
    label: '16週間 (フルシーズン準備) 🟡',
    weeks: 16,
    description: 'A優先レース向けの長期ペリオダイゼーション。'
        + 'ベース→ビルド→ピーク→テーパーの全工程を含む。',
    evidence: 'スポーツ科学のマクロサイクル設計の標準形。大きなレース目標（グランフォンドや峠チャレンジなど）には'
        + '16週が最もROIが高い（Jeukendrup & Gleeson, 2019）。'
  },
  {
    label: '20週間 (ロング準備期) 🟡',
    weeks: 20,
    description: 'FTPが低い段階から大きく向上させたい場合や、フォームが乱れたまま次シーズンを迎えたい場合に。',
    evidence: 'Bourdonらの2017年レビューでは、初中級者が上位の競技力に到達するには20週程度の連続トレーニング刺激が必要と報告。'
  },
  {
    label: '期間を手動指定',
    weeks: 0,
    description: '開始日と終了日を自分で設定します。',
    evidence: ''
  }
];

export function renderGoals(): string {
  return `
    ${renderSidebar()}
    ${renderTopBar()}
    <main class="main-content main-content-with-topbar">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">${icons.goals}</div>
          <div>
            <h1 class="page-title">目標設定</h1>
            <p class="page-subtitle">レース目標とアスリート情報を設定して、精度の高いプランを生成</p>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-new-goal">
            ${icons.plus}
            <span>新規目標</span>
          </button>
        </div>
      </div>

      <div class="card" id="goals-container">
        <div class="empty-state">
          <div class="empty-state-icon">${icons.goals}</div>
          <div class="empty-state-title">まだ目標がありません</div>
          <p class="empty-state-desc">レース目標を設定すると、AIがより精度の高いトレーニングプランを生成します。</p>
          <button class="btn btn-primary" id="btn-first-goal">
            ${icons.plus}
            <span>最初の目標を設定</span>
          </button>
        </div>
      </div>

      <div id="active-goal-section" style="margin-top: 24px; display: none;">
        <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--color-primary);">${icons.zap}</span> 現在取り組んでいる目標
        </h2>
        <div id="active-goal-card-container"></div>
      </div>
      
      <div class="modal-overlay" id="goal-modal" style="display:none;">
        <div class="modal" style="max-width: 560px; width: 95%;">
          <h2 class="modal-title">新規目標を作成</h2>
          <form id="goal-form">
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label">目標タイプ</label>
              <select class="form-input" id="goal-type">
                <option value="race">🏔️ レース出場 / 完走</option>
                <option value="ftp">⚡ FTP向上</option>
                <option value="profile">🚴 脚質強化 (スプリンター, クライマー等)</option>
                <option value="weight">⚖️ 減量 / フィットネス向上</option>
                <option value="other">🎯 トレーニングブロック (その他)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label">目標名 / 大会名</label>
              <input class="form-input" type="text" id="goal-name" placeholder="例: 富士ヒルクライム または FTP 250W達成" />
            </div>

            <!-- レースのみ: 日付 -->
            <div id="section-race-date" style="display:none; margin-bottom:16px;">
              <div class="form-group">
                <label class="form-label">レース開催日</label>
                <input class="form-input" type="date" id="goal-race-date" />
              </div>
            </div>

            <!-- レース以外: 期間選択 -->
            <div id="section-period" style="display:block; margin-bottom:16px;">
              <label class="form-label" style="margin-bottom:8px; display:block;">
                トレーニング期間
                <span style="font-size:0.75rem; font-weight:400; color:var(--color-text-muted); margin-left:8px;">
                  スポーツ科学の知見に基づく推奨期間を選択できます
                </span>
              </label>
              <select class="form-input" id="goal-period-select" style="margin-bottom:8px;">
                ${TRAINING_PERIODS.map((p, i) => `<option value="${i}">${p.label}</option>`).join('')}
              </select>

              <!-- 期間の説明ボックス -->
              <div id="period-desc-box" style="
                background: var(--color-primary-bg);
                border: 1px solid var(--color-primary-light);
                border-radius: var(--radius-md);
                padding: 12px 14px;
                font-size: 0.82rem;
                line-height: 1.6;
                margin-bottom: 12px;
              ">
                <div id="period-desc" style="color: var(--color-text-secondary); margin-bottom:6px;"></div>
                <div id="period-evidence" style="color: var(--color-text-muted); font-style:italic; border-top: 1px dashed var(--color-border); padding-top:6px; display:none;"></div>
              </div>

              <!-- 開始日 + 期間表示 -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                  <label class="form-label">開始日</label>
                  <input class="form-input" type="date" id="goal-start-date" />
                </div>
                <div class="form-group">
                  <label class="form-label">終了日 (予定)</label>
                  <input class="form-input" type="date" id="goal-end-date" />
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label">具体的な数値目標 (任意)</label>
              <input class="form-input" type="text" id="goal-target" placeholder="例: 1:30:00, 250W, 65kg など" />
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label">メモ</label>
              <textarea class="form-input" id="goal-memo" rows="2" placeholder="目標達成に向けた意気込みや課題..."></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="cancel-goal">キャンセル</button>
              <button type="submit" class="btn btn-primary">作成</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  `;
}

export function initGoals() {
  const container = document.getElementById('goals-container');
  const activeSection = document.getElementById('active-goal-section');
  const activeContainer = document.getElementById('active-goal-card-container');

  const renderGoalsList = () => {
    if (!container || !activeSection || !activeContainer) return;
    
    const savedGoals = JSON.parse(storage.getItem('user_goals') || '[]');
    const activeGoalId = storage.getItem('active_goal_id');

    if (savedGoals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${icons.goals}</div>
          <div class="empty-state-title">まだ目標がありません</div>
          <p class="empty-state-desc">レース目標を設定すると、AIがより精度の高いトレーニングプランを生成します。</p>
          <button class="btn btn-primary" id="btn-first-goal-inner">
            ${icons.plus}
            <span>最初の目標を設定</span>
          </button>
        </div>
      `;
      activeSection.style.display = 'none';
      document.getElementById('btn-first-goal-inner')?.addEventListener('click', showModal);
      return;
    }

    // Render Active Goal
    const activeGoal = savedGoals.find((g: any) => g.id === activeGoalId);
    if (activeGoal) {
      activeSection.style.display = 'block';
      activeContainer.innerHTML = renderGoalCardHtml(activeGoal, true);
    } else {
      activeSection.style.display = 'none';
    }

    // Render All Goals
    container.innerHTML = savedGoals.map((g: any) => renderGoalCardHtml(g, g.id === activeGoalId)).join('');

    // Attach listeners
    document.querySelectorAll('.btn-set-active').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        storage.setItem('active_goal_id', id || '');
        renderGoalsList();
      });
    });
  };

  function renderGoalCardHtml(goal: any, isActive: boolean) {
    let icon = '🎯';
    let color = 'var(--color-primary)';
    let bg = 'var(--color-primary-bg)';
    switch (goal.type) {
      case 'race': icon = '🏔️'; color = '#3B82F6'; bg = 'rgba(59,130,246,0.1)'; break;
      case 'ftp': icon = '⚡'; color = '#F59E0B'; bg = 'rgba(245,158,11,0.1)'; break;
      case 'profile': icon = '🚴'; color = '#10B981'; bg = 'rgba(16,185,129,0.1)'; break;
      case 'weight': icon = '⚖️'; color = '#8B5CF6'; bg = 'rgba(139,92,246,0.1)'; break;
    }

    const targetHtml = goal.target ? `<div style="font-size:0.85rem;color:var(--color-text-secondary);margin-top:4px;font-weight:500;">目標値: ${goal.target}</div>` : '';
    const memoHtml = goal.memo ? `<div style="font-size:0.8rem;color:var(--color-text-muted);margin-top:6px;border-top:1px dashed var(--color-border);padding-top:6px;">${goal.memo}</div>` : '';
    
    return `
      <div style="padding: 10px 0;">
        <div style="display:flex;align-items:flex-start;gap:16px;padding:20px;background:${bg};border-radius:var(--radius-md);border:${isActive ? `2px solid ${color}` : '1px solid rgba(0,0,0,0.05)'}; position: relative;">
          ${isActive ? `<div style="position: absolute; top: -10px; right: 20px; background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">実行中</div>` : ''}
          <div style="width:48px;height:48px;background:${color};border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:white;font-size:1.4rem;flex-shrink:0;">${icon}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:1.05rem;">${goal.name}</div>
            <div style="font-size:0.8rem;color:${color};margin-top:2px;font-weight:600;">${goal.type === 'race' ? 'レース目標' : 'トレーニングブロック'}</div>
            ${targetHtml}
            ${memoHtml}
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              ${!isActive ? `<button class="btn btn-outline btn-sm btn-set-active" data-id="${goal.id}">この目標を実行する</button>` : `
                <button class="btn btn-primary btn-sm" onclick="requestPlanForGoal('${goal.id}')">
                  ${icons.chat} AIでこの目標のプランを作成
                </button>
              `}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;background:var(--color-white);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--color-border-light);min-width:130px; height: fit-content;">
            <div style="font-size:0.7rem;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:2px;">期間</div>
            <div style="font-weight:700;color:${color};font-size:0.85rem;">${goal.period}</div>
          </div>
        </div>
      </div>
    `;
  }

  const modal = document.getElementById('goal-modal');
  const goalTypeSelect = document.getElementById('goal-type') as HTMLSelectElement;
  const periodSelect = document.getElementById('goal-period-select') as HTMLSelectElement;
  const startDateInput = document.getElementById('goal-start-date') as HTMLInputElement;
  const endDateInput = document.getElementById('goal-end-date') as HTMLInputElement;
  const raceDateInput = document.getElementById('goal-race-date') as HTMLInputElement;
  const sectionRaceDate = document.getElementById('section-race-date');
  const sectionPeriod = document.getElementById('section-period');
  const periodDescEl = document.getElementById('period-desc');
  const periodEvidenceEl = document.getElementById('period-evidence');

  const showModal = () => {
    if (modal) modal.style.display = 'flex';
    // Set default start to today
    const today = new Date().toISOString().split('T')[0];
    if (startDateInput && !startDateInput.value) startDateInput.value = today;
    updatePeriodDesc();
    updateEndDate();
    toggleFormSections();
  };

  const hideModal = () => {
    if (modal) modal.style.display = 'none';
  };

  function toggleFormSections() {
    const isRace = goalTypeSelect?.value === 'race';
    if (sectionRaceDate) sectionRaceDate.style.display = isRace ? 'block' : 'none';
    if (sectionPeriod) sectionPeriod.style.display = isRace ? 'none' : 'block';
  }

  function updatePeriodDesc() {
    if (!periodSelect || !periodDescEl || !periodEvidenceEl) return;
    const idx = parseInt(periodSelect.value, 10);
    const period = TRAINING_PERIODS[idx];
    if (!period) return;

    periodDescEl.innerHTML = period.description;

    const isManual = period.weeks === 0;
    const evidenceBox = document.getElementById('period-desc-box');
    if (evidenceBox) {
      evidenceBox.style.display = isManual ? 'none' : 'block';
    }

    if (period.evidence) {
      periodEvidenceEl.innerHTML = `📚 根拠: ${period.evidence}`;
      periodEvidenceEl.style.display = 'block';
    } else {
      periodEvidenceEl.style.display = 'none';
    }
    
    // Lock end-date input if a predefined period is selected
    if (endDateInput) {
      endDateInput.readOnly = !isManual;
      endDateInput.style.background = isManual ? '' : 'var(--color-bg)';
    }
  }

  function updateEndDate() {
    if (!periodSelect || !startDateInput || !endDateInput) return;
    const idx = parseInt(periodSelect.value, 10);
    const period = TRAINING_PERIODS[idx];
    if (!period || period.weeks === 0) return; // manual mode

    const start = startDateInput.value;
    if (!start) return;

    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() + period.weeks * 7);
    endDateInput.value = startDate.toISOString().split('T')[0];
  }

  document.getElementById('btn-new-goal')?.addEventListener('click', showModal);
  document.getElementById('btn-first-goal')?.addEventListener('click', showModal);
  document.getElementById('cancel-goal')?.addEventListener('click', hideModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  goalTypeSelect?.addEventListener('change', () => {
    toggleFormSections();
    updatePeriodDesc();
    updateEndDate();
  });

  periodSelect?.addEventListener('change', () => {
    updatePeriodDesc();
    updateEndDate();
  });

  startDateInput?.addEventListener('change', updateEndDate);

  document.getElementById('goal-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    hideModal();

    const nameInput = document.getElementById('goal-name') as HTMLInputElement;
    const targetInput = document.getElementById('goal-target') as HTMLInputElement;
    const memoInput = document.getElementById('goal-memo') as HTMLTextAreaElement;

    const goalId = Date.now().toString();
    const goalType = goalTypeSelect?.value || 'race';
    const goalName = nameInput?.value || '新しい目標';
    const goalTarget = targetInput?.value || '';
    const goalMemo = memoInput?.value || '';

    let dateValue = '';
    if (goalType === 'race') {
      dateValue = raceDateInput?.value || '未設定';
    } else {
      const start = startDateInput?.value;
      const end = endDateInput?.value;
      dateValue = start && end ? `${start} 〜 ${end}` : '未設定';
    }

    // Save to storage
    const saved = JSON.parse(storage.getItem('user_goals') || '[]');
    const newGoal = { id: goalId, type: goalType, name: goalName, period: dateValue, target: goalTarget, memo: goalMemo };
    saved.unshift(newGoal);
    storage.setItem('user_goals', JSON.stringify(saved.slice(0, 20)));
    
    // Automatically set as active if it's the first one
    if (saved.length === 1) {
      storage.setItem('active_goal_id', goalId);
    }

    renderGoalsList();
    (document.getElementById('goal-form') as HTMLFormElement)?.reset();
    
    // Prompt for plan generation
    setTimeout(() => {
        if (confirm(`目標「${goalName}」を作成しました！\nこの目標に向けた週次トレーニングプランをAIで生成しますか？`)) {
            window.location.hash = '#/plans';
        }
    }, 100);
  });

  renderGoalsList();
}

// Global: called from inline onclick in goal card
(window as any).requestPlanForGoal = (goalId: string) => {
  sessionStorage.setItem('pending_goal_id', goalId);
  window.location.hash = '#/plans';
};
