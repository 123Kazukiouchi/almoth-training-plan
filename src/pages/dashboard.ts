// Dashboard page with metrics and chart

import { renderSidebar, renderTopBar } from '../components/sidebar';
import { icons } from '../components/icons';
import { metrics, generateChartData } from '../data/mockData'; // Default fallback
import { fetchWellness, fetchActivities } from '../services/intervalsSync';
import { fetchHevyWorkouts } from '../services/hevySync';
import type { IntervalsWellness, IntervalsActivity } from '../services/intervalsSync';
import { showActivityModal } from '../components/activityModal';
import { Chart, registerables } from 'chart.js';
import { storage } from '../utils/storage';
import { getDailyAdvice, evaluateProgressionLevels, predictFutureFtp, predictLevelUp } from '../services/aiService';
import { aggregateDailyTss, fillDailyGaps, calculateHistory } from '../utils/trainingLoad';

Chart.register(...registerables);

function getMetricIcon(index: number): string {
    const iconList = [icons.trendUp, icons.trendDown, icons.zap, icons.heartbeat, icons.bike];
    const colors = ['#10B981', '#3B82F6', '#A855F7', '#EC4899', '#F97316'];
    return `<span style="color:${colors[index]}">${iconList[index]}</span>`;
}

export function renderDashboard(): string {
    return `
    ${renderSidebar()}
    ${renderTopBar()}
    <main class="main-content main-content-with-topbar">
      <div class="page-header">
        <div>
          <h1 class="page-title">ダッシュボード</h1>
          <p class="page-subtitle">トレーニング状態の概要</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-outline" id="btn-calendar-view">
            ${icons.calendar}
          </button>
          <button class="btn btn-outline" id="btn-sync">
            ${icons.sync}
            <span>Intervals.icu 同期</span>
          </button>
        </div>
      </div>

      <div id="ai-ftp-prediction-banner" style="margin-bottom: 24px;"></div>

      <!-- Training Cycle Section (New) -->
      <div id="training-cycle-section" style="margin-bottom: 24px; display: none;"></div>

      <div class="metrics-grid" id="dashboard-metrics-grid">
        <div style="grid-column: 1 / -1; display: flex; justify-content: center; padding: 20px;">
          <svg class="animate-spin" style="animation: spin 1s linear infinite; color: var(--color-primary);" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
          </svg>
        </div>
      </div>

      <div class="dashboard-grid-container">
        <!-- Athlete Levels (Left or Top) -->
        <div class="card" id="athlete-levels-card" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0;">アスリートレベル</h2>
            <span id="athlete-levels-ftp-label" style="font-size: 0.85rem; color: var(--color-text-muted);">--- FTPに基づく</span>
          </div>
          <div id="athlete-levels-container" style="display: flex; flex-direction: column; gap: 16px;"></div>
        </div>

        <!-- Today's Advice & Level Up (Middle) -->
        <div id="today-advice-section" style="display: none;">
          <div class="card" style="height: 100%; border-left: 4px solid var(--color-primary);">
            <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">本日の予定と予測</h2>
            <div id="today-workouts" style="margin-bottom: 20px;"></div>
            
            <div id="level-up-prediction" style="margin-bottom: 20px; padding: 12px; background: var(--color-success-bg); border-radius: var(--radius-md); display: none;">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-success); margin-bottom: 8px;">🔥 このワークアウトで向上するレベル:</div>
                <div id="level-up-values" style="display: flex; gap: 12px; font-size: 0.9rem; font-weight: 600;"></div>
            </div>

            <div id="ai-advice-container">
              <button class="btn btn-primary" id="btn-get-advice" style="width: 100%;">
                ${icons.chat} AIコーチに今日のアドバイスをもらう
              </button>
              <div id="advice-content" style="display: none; margin-top: 16px; padding: 16px; background: var(--color-bg); border-radius: var(--radius-md); font-size: 0.9rem; line-height: 1.6;"></div>
            </div>
          </div>
        </div>

        <!-- Recent Activities (Right) -->
        <div class="card" style="height: 100%;">
          <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">最近のアクティビティ</h2>
          <div id="recent-activities-list"></div>
        </div>

        <!-- Chart (Full width) -->
        <div class="chart-card dashboard-full-width">
          <div class="chart-header">
            <div class="chart-title">フィットネス推移</div>
            <div class="chart-subtitle">過去90日間の Fitness / Fatigue / Form / HR / FTP トレンド</div>
          </div>
          <div class="chart-container">
            <canvas id="fitness-chart"></canvas>
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderAthleteLevels(levels: any) {
    const container = document.getElementById('athlete-levels-container');
    const card = document.getElementById('athlete-levels-card');
    const ftpBtn = document.getElementById('athlete-levels-ftp-label');
    if (!container || !card) return;

    card.style.display = 'block';
    const ftp = storage.getItem('user_ftp') || '---';
    const lastUpdate = levels.lastUpdate ? new Date(levels.lastUpdate).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '未更新';
    
    if (ftpBtn) ftpBtn.innerHTML = `<div>${ftp} FTPに基づく</div><div style="font-size: 0.7rem; opacity: 0.8;">最終更新: ${lastUpdate}</div>`;

    const zones = [
        { key: 'endurance', label: '持久力', color: 'linear-gradient(90deg, #3B82F6, #2563EB)' },
        { key: 'tempo', label: 'テンポ', color: 'linear-gradient(90deg, #10B981, #059669)' },
        { key: 'sweetSpot', label: 'スイートスポット', color: 'linear-gradient(90deg, #F59E0B, #D97706)' },
        { key: 'threshold', label: '閾値', color: 'linear-gradient(90deg, #EF4444, #DC2626)' },
        { key: 'vo2max', label: 'VO2マックス', color: 'linear-gradient(90deg, #8B5CF6, #7C3AED)' },
        { key: 'anaerobic', label: '無酸素', color: 'linear-gradient(90deg, #EC4899, #DB2777)' },
    ];

    container.innerHTML = zones.map(z => {
        const val = levels[z.key] || 1.0;
        const percent = Math.min(100, (val / 10) * 100);
        return `
            <div style="display: grid; grid-template-columns: 100px 40px 1fr; align-items: center; gap: 12px; margin-bottom: 4px;">
                <span style="font-size: 0.85rem; font-weight: 500; color: var(--color-text-secondary);">${z.label}</span>
                <span style="font-size: 0.9rem; font-weight: 700; color: var(--color-text-primary);">${val.toFixed(1)}</span>
                <div style="height: 10px; background: var(--color-bg); border-radius: 5px; overflow: hidden; position: relative; border: 1px solid var(--color-border-light);">
                    <div style="height: 100%; width: ${percent}%; background: ${z.color}; border-radius: 5px; transition: width 1s ease-out;"></div>
                </div>
            </div>
        `;
    }).join('') + `
        <div style="margin-top: 12px; border-top: 1px solid var(--color-border-light); padding-top: 12px;">
            <button class="btn btn-outline btn-sm" id="btn-re-evaluate-levels" style="width: 100%; font-size: 0.75rem;">
                ${icons.sync} AIレベルを再評価する
            </button>
        </div>
    `;

    document.getElementById('btn-re-evaluate-levels')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-re-evaluate-levels') as HTMLButtonElement;
        btn.disabled = true;
        btn.innerHTML = `${icons.sync} 分析中...`;
        
        const activitiesData = JSON.parse(storage.getItem('latest_activities_cache') || '[]');
        if (activitiesData.length > 0) {
            const newLevels = await evaluateProgressionLevels(activitiesData);
            renderAthleteLevels(newLevels);
        } else {
            btn.innerHTML = 'データ不足';
            setTimeout(() => { btn.disabled = false; btn.innerHTML = `${icons.sync} AIレベルを再評価する`; }, 2000);
        }
    });
}

function renderFtpPrediction(p: { current: number, predicted: number, date: string, confidence: number }) {
    const banner = document.getElementById('ai-ftp-prediction-banner');
    if (!banner) return;

    const diff = p.predicted - p.current;
    const diffPercent = ((diff / p.current) * 100).toFixed(1);
    const color = diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    const sign = diff >= 0 ? '+' : '';

    banner.innerHTML = `
        <div class="card" style="padding: 24px; position: relative; overflow: hidden; border-top: 4px solid var(--color-primary);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--color-primary);">${icons.zap}</span>
                    <span style="font-weight: 700; font-size: 0.9rem;">AIによるFTP予測 <span style="background: var(--color-text-muted); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; margin-left: 4px;">ベータ</span></span>
                </div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">${p.date}</div>
            </div>
            
            <div style="text-align: center;">
                <div style="font-size: 4rem; font-weight: 800; line-height: 1; margin-bottom: 8px; color: var(--color-text-primary);">
                    ${p.predicted} <span style="font-size: 1.5rem; font-weight: 700;">FTP</span>
                </div>
                <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 4px;">10日後</div>
                <div style="font-size: 1rem; font-weight: 500;">
                    ${p.current} → <span style="font-weight: 700;">${p.predicted}</span> 
                    <span style="color: ${color}; font-weight: 700; margin-left: 4px;">(${sign}${diffPercent}%)</span>
                </div>
            </div>
            
            <div style="margin-top: 24px; display: flex; align-items: center; justify-content: center; gap: 16px; border-top: 1px solid var(--color-border-light); padding-top: 16px;">
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">
                    7件の予定ワークアウトに基づく
                </div>
                <button class="btn btn-primary btn-sm" id="btn-apply-ftp-pred">
                    適用する
                </button>
            </div>
        </div>
    `;
}

function renderTrainingCycle(activeGoal: any, nextWorkout: any) {
    const container = document.getElementById('training-cycle-section');
    if (!container) return;

    if (!activeGoal && !nextWorkout) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    
    let goalHtml = '';
    if (activeGoal) {
        let icon = '🎯';
        let color = 'var(--color-primary)';
        switch (activeGoal.type) {
            case 'race': icon = '🏔️'; color = '#3B82F6'; break;
            case 'ftp': icon = '⚡'; color = '#F59E0B'; break;
            case 'profile': icon = '🚴'; color = '#10B981'; break;
            case 'weight': icon = '⚖️'; color = '#8B5CF6'; break;
        }
        goalHtml = `
            <div class="card" style="flex: 1; border-left: 4px solid ${color}; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: ${color}; text-transform: uppercase;">現在の目標</div>
                    <button class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.7rem;" onclick="window.location.hash='#/goals'">変更</button>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 1.5rem;">${icon}</div>
                    <div>
                        <div style="font-weight: 700; font-size: 1rem;">${activeGoal.name}</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted);">${activeGoal.period}</div>
                    </div>
                </div>
                <div style="margin-top: 12px;">
                    <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="window.location.hash='#/plans'">
                        プランを確認・生成
                    </button>
                </div>
            </div>
        `;
    } else {
        goalHtml = `
            <div class="card" style="flex: 1; padding: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border: 1px dashed var(--color-border);">
                <div style="font-size: 1.2rem; margin-bottom: 4px;">🎯</div>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted);">目標が設定されていません</div>
                <button class="btn btn-outline btn-sm" style="margin-top: 8px;" onclick="window.location.hash='#/goals'">目標を設定する</button>
            </div>
        `;
    }

    let workoutHtml = '';
    if (nextWorkout) {
        const date = new Date(nextWorkout.date);
        const isToday = nextWorkout.date === new Date().toISOString().split('T')[0];
        workoutHtml = `
            <div class="card" style="flex: 1; border-left: 4px solid var(--color-secondary); padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-secondary); text-transform: uppercase;">次回のトレーニング</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">${isToday ? '今日' : `${date.getMonth()+1}/${date.getDate()}`}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 1.5rem;">📅</div>
                    <div style="min-width: 0;">
                        <div style="font-weight: 700; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nextWorkout.title}</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nextWorkout.description}</div>
                    </div>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                     <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="window.location.hash='#/calendar'">
                        カレンダー
                    </button>
                    <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.location.hash='#/chat'">
                        コツを聞く
                    </button>
                </div>
            </div>
        `;
    } else {
        workoutHtml = `
            <div class="card" style="flex: 1; padding: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border: 1px dashed var(--color-border);">
                <div style="font-size: 1.2rem; margin-bottom: 4px;">📅</div>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted);">予定がありません</div>
                <button class="btn btn-outline btn-sm" style="margin-top: 8px;" onclick="window.location.hash='#/plans'">プランを適用する</button>
            </div>
        `;
    }

    container.innerHTML = `
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            ${goalHtml}
            ${workoutHtml}
        </div>
    `;
}

let chartInstance: Chart | null = null;

function renderMetrics(currentMetrics: typeof metrics) {
    const grid = document.getElementById('dashboard-metrics-grid');
    if (!grid) return;
    grid.innerHTML = currentMetrics.map((m, i) => `
        <div class="metric-card" id="metric-card-${i}">
        <div class="metric-header">
            <span class="metric-label">${m.label}</span>
            <span class="metric-icon">${getMetricIcon(i)}</span>
        </div>
        <div class="metric-value ${typeof m.value === 'number' && m.value < 0 ? 'negative' : ''}">${m.value}</div>
        <div class="metric-sub">${m.sub}</div>
        </div>
    `).join('');
}

function renderActivities(activities: IntervalsActivity[]) {
    const list = document.getElementById('recent-activities-list');
    if (!list) return;

    if (activities.length === 0) {
        list.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--color-text-muted);">最近のアクティビティはありません。</div>`;
        return;
    }

    const html = activities.slice(0, 5).map((act, idx) => {
        const date = new Date(act.start_date_local);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const distanceKm = (act.distance / 1000).toFixed(1);
        const hrs = Math.floor(act.moving_time / 3600);
        const mins = Math.floor((act.moving_time % 3600) / 60);
        const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        let icon = icons.bike;
        if (act.type === 'VirtualRide' || act.type === 'IndoorCycle' || act.name.includes('屋内')) {
            icon = icons.indoorBike;
        } else if (act.type === 'Run') {
            icon = icons.run;
        } else if (act.type === 'WeightTraining' || act.type === 'Strength' || act.name.includes('筋トレ')) {
            icon = icons.weight;
        }
        
        const tssVal = act.icu_training_load || act.tss || '-';
        const npStr = act.normalized_watts ? `<span style="margin-left:8px;" title="Normalized Power">⚡${Math.round(act.normalized_watts)}W</span>` : '';
        const hrStr = act.average_heartrate ? `<span style="margin-left:8px;" title="Average HR">♥${Math.round(act.average_heartrate)}bpm</span>` : '';
        const elevStr = act.total_elevation_gain ? `<span style="margin-left:8px;" title="Elevation Gain">↗${Math.round(act.total_elevation_gain)}m</span>` : '';
        const spdStr = act.average_speed ? `<span style="margin-left:8px;" title="Average Speed">💨${(act.average_speed * 3.6).toFixed(1)}km/h</span>` : '';

        return `
        <div class="dashboard-activity-item" data-index="${idx}">
            <div class="dashboard-activity-info">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="dashboard-activity-icon-wrap">
                        ${icon}
                    </div>
                    <div style="min-width: 0;">
                        <div class="dashboard-activity-item-title">${act.name}</div>
                        <div class="dashboard-activity-item-meta">
                            <span>${dateStr}</span>
                            ${act.type === 'WeightTraining' ? '<span title="Source">Hevy</span>' : ''}
                            ${npStr}${hrStr}${elevStr}${spdStr}
                        </div>
                    </div>
                </div>
            </div>
            <div style="text-align: right; margin-left: 12px; flex-shrink: 0;">
                <div style="font-weight: 600; font-size: 0.95rem;">${tssVal} TSS</div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">${distanceKm}km / ${timeStr}</div>
            </div>
        </div>
        `;
    }).join('');

    list.innerHTML = html;

    // Attach click events
    document.querySelectorAll('.dashboard-activity-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const idx = parseInt((e.currentTarget as HTMLElement).dataset.index || '0');
            showActivityModal(activities[idx]);
        });
    });
}



export async function initDashboard() {
    const canvas = document.getElementById('fitness-chart') as HTMLCanvasElement;
    
    // First setup the logic
    const loadDashboardData = async () => {
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        
        // yyyy-mm-dd format
        const oldest = ninetyDaysAgo.toISOString().split('T')[0];
        const newest = now.toISOString().split('T')[0];

        try {
             // Parallel fetch
            const [wellnessData, activitiesData, hevyData] = await Promise.all([
                fetchWellness(oldest, newest),
                fetchActivities(oldest, newest),
                fetchHevyWorkouts()
            ]);

            let mergedActivities: IntervalsActivity[] = [];
            let todaysWorkouts: any[] = [];
            let latestW: IntervalsWellness = {} as IntervalsWellness;
            let latestMetrics = { ctl: 0, atl: 0, tsb: 0 };

            // If API not configured or failed, fallback to mock but continue analysis if possible
            if (activitiesData.length === 0 && hevyData.length === 0) {
                renderMetrics(metrics);
                renderActivities([]);
                renderChart(generateChartData());
            } else {
                // 1. Process Activities (Deduplication is already in fetchActivities)
                const formattedHevy = hevyData.map(hw => {
                    const start = new Date(hw.start_time);
                    const end = new Date(hw.end_time);
                    const movingTime = Math.round((end.getTime() - start.getTime()) / 1000);
                    return {
                        id: hw.id, start_date_local: hw.start_time, type: 'WeightTraining', name: hw.title, distance: 0,
                        moving_time: movingTime, elapsed_time: movingTime, total_elevation_gain: 0, average_speed: 0,
                        max_speed: 0, average_heartrate: 0, icu_training_load: 0, tss: 0, normalized_watts: 0,
                        average_watts: 0, device_name: 'Hevy', source: 'Hevy'
                    } as any as IntervalsActivity;
                });
                mergedActivities = [...activitiesData, ...formattedHevy].sort((a,b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());
                storage.setItem('latest_activities_cache', JSON.stringify(mergedActivities));
                renderActivities(mergedActivities);

                // 2. Calculate Custom Training Load (Fix for duplication)
                const dailyLoads = aggregateDailyTss(mergedActivities);
                const completeDailyLoads = fillDailyGaps(dailyLoads);
                const loadHistory = calculateHistory(completeDailyLoads);

                // 3. Extract Latest and Trend values
                const todayStr = now.toISOString().split('T')[0];
                const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                const weekAgoStr = weekAgo.toISOString().split('T')[0];

                latestMetrics = loadHistory.get(todayStr) || { ctl: 0, atl: 0, tsb: 0 };
                // Find closest historical value for '7 days ago'
                const pastDates = Array.from(loadHistory.keys()).sort();
                const weekAgoActualStr = pastDates.find(d => d >= weekAgoStr) || pastDates[0];
                const weekAgoMetrics = loadHistory.get(weekAgoActualStr) || { ctl: 0, atl: 0, tsb: 0 };

                latestW = wellnessData[wellnessData.length - 1] || {} as IntervalsWellness;
                let weight = latestW.weight != null ? latestW.weight : parseFloat(storage.getItem('user_weight') || '0');

                // Prefer Intervals.icu official CTL/ATL/TSB over local calculation
                const ictlNow = latestW.ctl != null ? latestW.ctl : latestMetrics.ctl;
                const iatlNow = latestW.atl != null ? latestW.atl : latestMetrics.atl;
                const itsbNow = latestW.tsb != null ? latestW.tsb : latestMetrics.tsb;

                // 7日前のwellness値を取得
                const weekAgoWellness = wellnessData.find(w => w.date && w.date.startsWith(weekAgoStr));
                const ictlPrev = weekAgoWellness?.ctl != null ? weekAgoWellness.ctl : weekAgoMetrics.ctl;
                const iatlPrev = weekAgoWellness?.atl != null ? weekAgoWellness.atl : weekAgoMetrics.atl;
                const itsbPrev = weekAgoWellness?.tsb != null ? weekAgoWellness.tsb : weekAgoMetrics.tsb;

                // FTP: wellness から最新値を取得してストレージにも保存
                const latestFtp = latestW.ftp || parseInt(storage.getItem('user_ftp') || '0') || null;
                if (latestW.ftp) storage.setItem('user_ftp', latestW.ftp.toString());

                let sleepStr = '-';
                if (latestW.sleepSecs) {
                    const hrs = Math.floor(latestW.sleepSecs / 3600);
                    const mins = Math.floor((latestW.sleepSecs % 3600) / 60);
                    sleepStr = `${hrs}h ${mins}m`;
                }

                const currentMetrics = [
                    { label: 'Fitness', labelEn: 'Fitness', value: Math.round(ictlNow), sub: `7日前: ${Math.round(ictlPrev)}`, iconColor: '#10B981' },
                    { label: 'Fatigue', labelEn: 'Fatigue', value: Math.round(iatlNow), sub: `7日前: ${Math.round(iatlPrev)}`, iconColor: '#3B82F6' },
                    { label: 'Form', labelEn: 'Form', value: Math.round(itsbNow), sub: `7日前: ${Math.round(itsbPrev)}`, iconColor: '#A855F7' },
                    { label: '安静時心拍', labelEn: 'Resting HR', value: latestW.restingHR != null ? latestW.restingHR : '-', sub: 'bpm', iconColor: '#EC4899' },
                    { label: 'HRV', labelEn: 'rMSSD', value: latestW.hrv ? Math.round(latestW.hrv) : '-', sub: latestW.hrvScore ? `スコア: ${latestW.hrvScore}` : 'ms', iconColor: '#8B5CF6' },
                    { label: '睡眠', labelEn: 'Sleep', value: sleepStr, sub: latestW.sleepScore ? `スコア: ${latestW.sleepScore}` : '', iconColor: '#6366F1' },
                    { label: 'FTP', labelEn: 'FTP', value: latestFtp ?? '-', sub: 'Watts', iconColor: '#F97316' },
                    { label: '体重', labelEn: 'Weight', value: weight > 0 ? weight : '-', sub: `体脂肪: ${latestW.bodyFat ? latestW.bodyFat + '%' : '-'}`, iconColor: '#F43F5E' }
                ];
                renderMetrics(currentMetrics);

                // 4. Prepare Chart Data from calculation results
                const chartLabels: string[] = [];
                const chartFitness: number[] = [];
                const chartFatigue: number[] = [];
                const chartForm: number[] = [];
                const chartHr: (number | null)[] = [];
                const chartFtp: number[] = [];

                // Use the dates from completeDailyLoads to ensure continuous chart
                const storedFtp = parseInt(storage.getItem('user_ftp') || '0');
                completeDailyLoads.forEach(l => {
                    const d = new Date(l.date);
                    chartLabels.push(`${d.getMonth()+1}/${d.getDate()}`);
                    const m = loadHistory.get(l.date)!;

                    // Prefer Intervals.icu wellness CTL/ATL/TSB over local calculation
                    const w = wellnessData.find(wd => wd.date && wd.date.startsWith(l.date));
                    chartFitness.push(w?.ctl ?? m.ctl);
                    chartFatigue.push(w?.atl ?? m.atl);
                    chartForm.push(w?.tsb ?? m.tsb);
                    chartHr.push(w?.restingHR || null);
                    chartFtp.push(w?.ftp || storedFtp);
                });

                renderChart({ 
                    labels: chartLabels, 
                    fitness: chartFitness, 
                    fatigue: chartFatigue, 
                    form: chartForm, 
                    hr: chartHr, 
                    ftp: chartFtp 
                });
            }

            // ... inside loadDashboardData, where renderFtpPrediction is called:
            predictFutureFtp().then(pred => {
                renderFtpPrediction(pred);
                // Handle Apply button
                setTimeout(() => {
                    const applyBtn = document.getElementById('btn-apply-ftp-pred');
                    if (applyBtn) {
                        applyBtn.addEventListener('click', () => {
                            if (confirm(`推定FTP ${pred.predicted}W をプロフィールに適用しますか？`)) {
                                storage.setItem('user_ftp', pred.predicted.toString());
                                // Update UI metrics immediately
                                loadDashboardData(); 
                            }
                        });
                    }
                }, 100);
            }).catch(console.error);

            // Fetch scheduled workouts for today
            const todayStr = new Date().toISOString().split('T')[0];
            const allScheduled = JSON.parse(storage.getItem('scheduled_workouts') || '[]');
            todaysWorkouts = allScheduled.filter((w: any) => w.date === todayStr);

            // Fetch Active Goal and Next Workout for Training Cycle
            const savedGoals = JSON.parse(storage.getItem('user_goals') || '[]');
            const activeGoalId = storage.getItem('active_goal_id');
            const activeGoal = savedGoals.find((g: any) => g.id === activeGoalId);
            
            const nextWorkout = allScheduled
                .filter((w: any) => w.date >= todayStr)
                .sort((a: any, b: any) => a.date.localeCompare(b.date))[0];

            renderTrainingCycle(activeGoal, nextWorkout);
            
            const adviceSection = document.getElementById('today-advice-section');
            const workoutsContainer = document.getElementById('today-workouts');
            
            if (adviceSection && workoutsContainer) {
                if (todaysWorkouts.length > 0) {
                    adviceSection.style.display = 'block';
                    workoutsContainer.innerHTML = todaysWorkouts.map((w: any) => `
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                            <div style="font-size:1.5rem;">📅</div>
                            <div>
                                <div style="font-weight:700;">${w.title}</div>
                                <div style="font-size:0.85rem; color:var(--color-text-muted);">${w.description}</div>
                            </div>
                        </div>
                    `).join('');
                } else {
                    adviceSection.style.display = 'block';
                    workoutsContainer.innerHTML = `<div style="color:var(--color-text-muted); margin-bottom:8px;">本日はカレンダーに予定されたワークアウトはありません。</div>`;
                }
            }

            // Hook up advice button
            const btnAdvice = document.getElementById('btn-get-advice');
            if (btnAdvice) {
                // Remove old listeners by cloning
                const newBtn = btnAdvice.cloneNode(true) as HTMLButtonElement;
                btnAdvice.parentNode?.replaceChild(newBtn, btnAdvice);
                
                newBtn.addEventListener('click', async () => {
                    const adviceContent = document.getElementById('advice-content');
                    if (!adviceContent) return;
                    
                    if (!storage.getItem('gemini_api_key')) {
                        alert('設定画面からGemini APIキーを登録してください。');
                        return;
                    }
                    
                    newBtn.disabled = true;
                    newBtn.innerHTML = 'AIコーチが分析中...';
                    adviceContent.style.display = 'block';
                    adviceContent.innerHTML = '<div style="text-align:center;color:var(--color-text-muted);">最近のトレーニング負荷とウェルネスデータを分析しています...</div>';
                    
                    try {
                        const mergedForAdvice = { ...latestW, ...latestMetrics };
                        const advice = await getDailyAdvice(mergedForAdvice, todaysWorkouts, mergedActivities);
                        adviceContent.innerHTML = advice.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                    } catch (e: any) {
                        adviceContent.innerHTML = `<span style="color:var(--color-danger);">エラーが発生しました: ${e.message}</span>`;
                    } finally {
                        newBtn.disabled = false;
                        newBtn.innerHTML = `${icons.chat} 別のアドバイスをもらう`;
                    }
                });
            }

            // Advanced AI Analytics
            evaluateProgressionLevels(mergedActivities).then(renderAthleteLevels).catch(console.error);
            predictFutureFtp().then(renderFtpPrediction).catch(console.error);

            // Level Up Prediction for today
            if (todaysWorkouts.length > 0) {
                predictLevelUp(todaysWorkouts[0]).then(up => {
                    const predictionContainer = document.getElementById('level-up-prediction');
                    const valuesContainer = document.getElementById('level-up-values');
                    if (predictionContainer && valuesContainer && Object.keys(up).length > 0) {
                        predictionContainer.style.display = 'block';
                        valuesContainer.innerHTML = Object.entries(up).map(([k, v]) => {
                            const labelMap: any = { endurance: '持久力', tempo: 'テンポ', sweetSpot: 'SS', threshold: '閾値', vo2max: 'VO2Max', anaerobic: '無酸素' };
                            return `<span>${labelMap[k] || k}: <span style="color:var(--color-success);">+${v}</span></span>`;
                        }).join('');
                    }
                }).catch(console.error);
            }

        } catch(e) {
            console.error('Error loading dashboard', e);
            renderMetrics(metrics);
            renderActivities([]);
            renderChart(generateChartData());
        }
    };

    // Trigger load
    loadDashboardData();

    // Hook up sync button
    document.getElementById('btn-sync')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-sync') as HTMLButtonElement;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin" style="animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
        </svg><span>同期中...</span>`;
        btn.disabled = true;

        await loadDashboardData();

        btn.innerHTML = originalHtml;
        btn.disabled = false;
    });

    // Helper to render chart
    function renderChart(data: any) {
        if (!canvas) return;
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                {
                    label: 'Fitness (体力)',
                    data: data.fitness,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                },
                {
                    label: 'Fatigue (疲労)',
                    data: data.fatigue,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                },
                {
                    label: 'Form (調子)',
                    data: data.form,
                    borderColor: '#A855F7',
                    backgroundColor: 'rgba(168, 85, 247, 0.05)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                },
                {
                    label: '安静時HR',
                    data: data.hr,
                    borderColor: '#EC4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.05)',
                    borderWidth: 1.5,
                    borderDash: [6, 3],
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    yAxisID: 'y1',
                },
                {
                    label: 'FTP (W)',
                    data: data.ftp,
                    borderColor: '#F97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.05)',
                    borderWidth: 1.5,
                    borderDash: [10, 5],
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    yAxisID: 'y1',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'line',
                        font: {
                            family: 'Inter',
                            size: 11,
                        },
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { family: 'Inter', size: 12 },
                    bodyFont: { family: 'Inter', size: 11 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Inter', size: 10 },
                        color: '#94A3B8',
                        maxTicksLimit: 15,
                    },
                    border: { display: false },
                },
                y: {
                    position: 'left',
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)',
                    },
                    ticks: {
                        font: { family: 'Inter', size: 10 },
                        color: '#94A3B8',
                    },
                    border: { display: false },
                    min: -45,
                    max: 135,
                },
                y1: {
                    position: 'right',
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Inter', size: 10 },
                        color: '#94A3B8',
                    },
                    border: { display: false },
                    min: 0,
                    max: 240,
                },
            },
        },
    });
}
}

export function cleanupDashboard() {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}
