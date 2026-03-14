import type { IntervalsActivity } from '../services/intervalsSync';
import type { HevyWorkout } from '../services/hevySync';
import { icons } from './icons';
import { getDynamicWorkoutAdvice } from '../services/aiService';

export function showActivityModal(activity: IntervalsActivity) {
    let overlay = document.getElementById('activity-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'activity-modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) hideActivityModal();
        });
    }

    // Prepare main fields
    const date = new Date(activity.start_date_local);
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const distanceKm = (activity.distance / 1000).toFixed(2);
    const hrs = Math.floor(activity.moving_time / 3600);
    const mins = Math.floor((activity.moving_time % 3600) / 60);
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    const icon = activity.type === 'Ride' ? icons.bike : activity.type === 'Run' ? '🏃' : '💪';

    const tssVal = activity.icu_training_load || activity.tss || '-';
    
    // Group all other raw properties for the detailed table
    const excludeKeys = ['id', 'name', 'type', 'start_date_local', 'distance', 'moving_time', 'icu_training_load', 'tss'];
    const rawDataHtml = Object.keys(activity)
        .filter(key => !excludeKeys.includes(key))
        .map(key => {
            let val = activity[key];
            if (typeof val === 'object') {
                val = JSON.stringify(val);
            }
            return `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-border-light);">
                <span style="color: var(--color-text-secondary); font-size: 0.85rem; font-weight: 500;">${key}</span>
                <span style="color: var(--color-text-primary); font-size: 0.85rem; text-align: right; word-break: break-all; max-width: 60%;">${val}</span>
            </div>
            `;
        }).join('');

    overlay.innerHTML = `
        <div class="modal" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="width: 48px; height: 48px; background: var(--color-primary-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--color-primary); flex-shrink: 0;">
                        ${icon}
                    </div>
                    <div>
                        <h2 class="modal-title" style="margin-bottom: 4px;">${activity.name}</h2>
                        <div style="font-size: 0.85rem; color: var(--color-text-muted);">${dateStr} • ${timeStr}</div>
                    </div>
                </div>
                <button id="btn-close-activity-modal" style="color: var(--color-text-muted); padding: 8px; border-radius: 50%; cursor: pointer;">
                    ✕
                </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Distance</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary);">${distanceKm} <span style="font-size: 0.8rem; font-weight: 500;">km</span></div>
                </div>
                <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">TSS</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary);">${tssVal}</div>
                </div>
                <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">IF</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary);">${activity.icu_intensity ? (activity.icu_intensity / 100).toFixed(2) : '-'}</div>
                </div>
            </div>

            <div id="activity-progression-section" style="margin-bottom: 24px; display: none;">
                <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid var(--color-success); padding-bottom: 8px; color: var(--color-success);">📈 このワークアウトによる成長</h3>
                <div id="activity-progression-content" style="background: var(--color-success-bg); padding: 16px; border-radius: var(--radius-md); font-size: 0.9rem; line-height: 1.6;">
                    <div id="activity-progression-values" style="display: flex; gap: 12px; font-weight: 700; color: var(--color-success); margin-bottom: 8px;"></div>
                    <div id="activity-progression-advice" style="color: var(--color-text-primary);"></div>
                </div>
            </div>

            <div style="margin-bottom: 24px; text-align: center;">
                <button class="btn btn-outline" id="btn-analyze-activity" style="width: 100%;">
                    ${icons.chat} AIでこのワークアウトを詳細分析する
                </button>
            </div>

            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">詳細データ (All Raw Data)</h3>
            <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md);">
                ${rawDataHtml || '<div style="text-align:center; color: var(--color-text-muted); font-size:0.85rem;">詳細データがありません</div>'}
            </div>
        </div>
    `;

    overlay.style.display = 'flex';

    document.getElementById('btn-close-activity-modal')?.addEventListener('click', () => {
        hideActivityModal();
    });

    // AI Analysis Handle
    document.getElementById('btn-analyze-activity')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-analyze-activity') as HTMLButtonElement;
        const progSection = document.getElementById('activity-progression-section');
        const progValues = document.getElementById('activity-progression-values');
        const progAdvice = document.getElementById('activity-progression-advice');
        
        if (!progSection || !progValues || !progAdvice) return;

        btn.disabled = true;
        btn.innerHTML = 'AI分析中...';
        progSection.style.display = 'block';
        progAdvice.innerHTML = '<div style="text-align:center; color:var(--color-text-muted); padding:10px;">ワークアウトの負荷とゾーン滞在時間を分析しています...</div>';

        const { analyzeActivityProgression } = await import('../services/aiService');
        
        try {
            const result = await analyzeActivityProgression(activity);
            
            progValues.innerHTML = Object.entries(result.levels).map(([k, v]) => {
                const labelMap: any = { endurance: '持久力', tempo: 'テンポ', sweetSpot: 'SS', threshold: '閾値', vo2max: 'VO2Max', anaerobic: '無酸素' };
                return `<span>${labelMap[k] || k}: +${v}</span>`;
            }).join('');
            
            progAdvice.innerHTML = result.advice.replace(/\n/g, '<br/>');
            btn.style.display = 'none';
        } catch (e: any) {
            progAdvice.innerHTML = `<span style="color:var(--color-danger);">エラー: ${e.message}</span>`;
            btn.disabled = false;
            btn.innerHTML = '分析に失敗しました。再試行。';
        }
    });
}

export function hideActivityModal() {
    const overlay = document.getElementById('activity-modal-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.innerHTML = ''; // prevent memory leak
    }
}

export function showHevyModal(hw: HevyWorkout, matchingActivity?: IntervalsActivity) {
    let overlay = document.getElementById('activity-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'activity-modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) hideActivityModal();
        });
    }

    const date = new Date(hw.start_time);
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const t1 = new Date(hw.start_time).getTime();
    const t2 = new Date(hw.end_time).getTime();
    const movingTime = (t2 - t1) / 1000;
    const hrs = Math.floor(movingTime / 3600);
    const mins = Math.floor((movingTime % 3600) / 60);
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    const tssVal = matchingActivity ? (matchingActivity.icu_training_load || matchingActivity.tss || '-') : '-';
    const hrVal = matchingActivity?.average_heartrate ? Math.round(matchingActivity.average_heartrate) : '-';

    const exercisesHtml = hw.exercises.map(ex => {
        const setsHtml = ex.sets.map(s => `
            <div style="display: flex; justify-content: space-between; padding: 4px 12px; font-size: 0.85rem; border-bottom: 1px solid var(--color-border-light);">
                <span style="color: var(--color-text-secondary); width: 40px;">${s.index}</span>
                <span style="color: var(--color-text-primary); text-align: right; font-weight: 500;">${s.weight_kg} kg</span>
                <span style="color: var(--color-text-primary); text-align: right; font-weight: 500;">${s.reps} 回</span>
            </div>
        `).join('');

        return `
            <div style="margin-bottom: 16px; background: var(--color-bg); border-radius: var(--radius-md); overflow: hidden;">
                <div style="background: var(--color-border); padding: 8px 12px; font-weight: 600; font-size: 0.9rem;">
                    ${ex.title}
                </div>
                <div>
                   <div style="display: flex; justify-content: space-between; padding: 4px 12px; font-size: 0.75rem; color: var(--color-text-muted); border-bottom: 2px solid var(--color-border);">
                        <span style="width: 40px;">Set</span>
                        <span style="text-align: right;">Weight</span>
                        <span style="text-align: right;">Reps</span>
                   </div>
                   ${setsHtml}
                </div>
            </div>
        `;
    }).join('');

    overlay.innerHTML = `
        <div class="modal" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="width: 48px; height: 48px; background: var(--color-primary-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--color-primary); flex-shrink: 0;">
                        💪
                    </div>
                    <div>
                        <h2 class="modal-title" style="margin-bottom: 4px;">${hw.title}</h2>
                        <div style="font-size: 0.85rem; color: var(--color-text-muted);">${dateStr} • ${timeStr}</div>
                    </div>
                </div>
                <button id="btn-close-activity-modal" style="color: var(--color-text-muted); padding: 8px; border-radius: 50%; cursor: pointer;">
                    ✕
                </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
                <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">推定TSS (Intervals)</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary);">${tssVal}</div>
                </div>
                <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Average HR</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary);">${hrVal} <span style="font-size: 0.8rem; font-weight: 500;">bpm</span></div>
                </div>
            </div>

            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">メニュー詳細 (Hevy)</h3>
            <div style="margin-bottom: 16px;">
                ${exercisesHtml || '<div style="text-align:center; color: var(--color-text-muted); font-size:0.85rem;">詳細データがありません</div>'}
            </div>
            ${hw.description ? `
            <div style="background: var(--color-bg); padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--color-text-secondary);">
                ${hw.description}
            </div>` : ''}
        </div>
    `;

    overlay.style.display = 'flex';

    document.getElementById('btn-close-activity-modal')?.addEventListener('click', () => {
        hideActivityModal();
    });
}

export function showScheduledWorkoutModal(workout: { title: string; date: string; description: string; planId?: string }) {
    let overlay = document.getElementById('activity-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'activity-modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) hideActivityModal();
        });
    }

    const date = new Date(workout.date);
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    
    // Initial content with loading state for dynamic advice
    overlay.innerHTML = `
        <div class="modal" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="width: 48px; height: 48px; background: var(--color-primary-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--color-primary); flex-shrink: 0;">
                        📅
                    </div>
                    <div>
                        <h2 class="modal-title" style="margin-bottom: 4px;">${workout.title} [予定]</h2>
                        <div style="font-size: 0.85rem; color: var(--color-text-muted);">${dateStr}</div>
                    </div>
                </div>
                <button id="btn-close-activity-modal" style="color: var(--color-text-muted); padding: 8px; border-radius: 50%; cursor: pointer;">
                    ✕
                </button>
            </div>

            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">トレーニング内容</h3>
                <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md); line-height: 1.6; font-size: 0.95rem;">
                    ${workout.description || '詳細な指示はありません。'}
                </div>
            </div>

            <div id="dynamic-ai-advice-container" style="margin-bottom: 16px;">
                <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid var(--color-primary); padding-bottom: 8px; color: var(--color-primary);">💡 今日のAIアドバイス</h3>
                <div style="background: var(--color-primary-bg); padding: 16px; border-radius: var(--radius-md); font-size: 0.9rem; border-left: 4px solid var(--color-primary); line-height: 1.6; display: flex; align-items: center; gap: 12px;">
                    <svg class="animate-spin" style="animation: spin 1s linear infinite; color: var(--color-primary);" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
                    </svg>
                    <span>今日のコンディションと内容を分析中...</span>
                </div>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border-light); text-align: center;">
                <button class="btn btn-outline btn-sm" id="btn-close-modal-bottom">閉じる</button>
            </div>
        </div>
    `;

    overlay.style.display = 'flex';

    document.getElementById('btn-close-activity-modal')?.addEventListener('click', hideActivityModal);
    document.getElementById('btn-close-modal-bottom')?.addEventListener('click', hideActivityModal);

    // Fetch dynamic advice on the fly
    getDynamicWorkoutAdvice(workout.title, workout.description)
        .then(advice => {
            const container = document.getElementById('dynamic-ai-advice-container');
            if (container) {
                const htmlAdvice = advice.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                container.innerHTML = `
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid var(--color-primary); padding-bottom: 8px; color: var(--color-primary);">💡 今日のAIアドバイス</h3>
                    <div style="background: var(--color-primary-bg); padding: 16px; border-radius: var(--radius-md); font-size: 0.9rem; border-left: 4px solid var(--color-primary); line-height: 1.6;">
                        ${htmlAdvice}
                    </div>
                `;
            }
        })
        .catch(err => {
            const container = document.getElementById('dynamic-ai-advice-container');
            if (container) {
                container.innerHTML = `
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid var(--color-danger); padding-bottom: 8px; color: var(--color-danger);">💡 AIアドバイスを取得できませんでした</h3>
                    <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--color-text-muted);">
                        エラー: ${err.message}
                    </div>
                `;
            }
        });
}
