// Calendar page with weekly training view + Wellness integration

import { renderSidebar, renderTopBar } from '../components/sidebar';
import { icons } from '../components/icons';
import { fetchActivities, fetchWellness } from '../services/intervalsSync';
import type { IntervalsWellness } from '../services/intervalsSync';
import { fetchHevyWorkouts } from '../services/hevySync';
import { storage } from '../utils/storage';
import { showActivityModal, showHevyModal, showScheduledWorkoutModal } from '../components/activityModal';

const zoneColors: Record<string, string> = {
    z1: '#93C5FD', z2: '#38BDF8', z3: '#34D399',
    z4: '#FBBF24', z5: '#FB923C', z6: '#EF4444',
};

const zoneLabels: Record<string, string> = {
    z1: 'Z1 Recovery', z2: 'Z2 Endurance', z3: 'Z3 Tempo',
    z4: 'Z4 Threshold', z5: 'Z5 VO2max', z6: 'Z6 Anaerobic',
};

export function renderCalendar(): string {
    const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

    return `
    ${renderSidebar()}
    ${renderTopBar()}
    <main class="main-content main-content-with-topbar">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">${icons.calendar}</div>
          <div>
            <h1 class="page-title">カレンダー</h1>
            <p class="page-subtitle">実績データとウェルネスの統合表示</p>
          </div>
        </div>
        <div class="page-header-actions">
          <div class="calendar-nav">
            <button class="calendar-nav-btn" id="cal-prev">${icons.chevronLeft}</button>
            <button class="btn btn-outline" id="cal-today">今週</button>
            <button class="calendar-nav-btn" id="cal-next">${icons.chevronRight}</button>
          </div>
          <button class="btn btn-outline" id="cal-sync">${icons.sync} 同期</button>
        </div>
      </div>

      <div class="calendar-date-range" id="calendar-date-range-display">読み込み中...</div>

      <div class="calendar-days-header">
        ${dayNames.map(d => `<div>${d}</div>`).join('')}
      </div>

      <div id="calendar-grid-container">
        <div style="display: flex; justify-content: center; padding: 40px;">
          <svg class="animate-spin" style="animation: spin 1s linear infinite; color: var(--color-primary);" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
          </svg>
        </div>
      </div>

      <div class="calendar-legend">
        ${Object.entries(zoneLabels).map(([key, label]) => `
          <div class="calendar-legend-item">
            <div class="calendar-legend-dot" style="background:${zoneColors[key]};"></div>
            <span>${label}</span>
          </div>
        `).join('')}
        <div class="calendar-legend-item">
          <div class="calendar-legend-dot" style="background:linear-gradient(135deg,#a78bfa,#60a5fa);"></div>
          <span>ウェルネス記録あり</span>
        </div>
      </div>

      <!-- Wellness Detail Popover -->
      <div id="wellness-popover" style="
        display: none;
        position: fixed;
        z-index: 300;
        background: white;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        padding: 16px;
        width: 280px;
        font-size: 0.85rem;
        pointer-events: auto;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
          <strong id="wellness-popover-date" style="font-size:0.9rem;"></strong>
          <button id="wellness-popover-close" style="background:none;border:none;cursor:pointer;font-size:1.2rem;line-height:1;">&times;</button>
        </div>
        <div id="wellness-popover-content" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;"></div>
      </div>
    </main>
  `;
}

function isToday(dateStr: string): boolean {
    const today = new Date();
    const [month, day] = dateStr.split('/').map(Number);
    return today.getMonth() + 1 === month && today.getDate() === day;
}

/**
 * Formats wellness data into human readable rows for the popover
 */
function formatWellnessPopover(w: IntervalsWellness): string {
    const fmt = (label: string, value: any, unit: string = '') => {
        if (value === null || value === undefined) return '';
        return `<div style="background:var(--color-bg);border-radius:var(--radius-sm);padding:4px 8px;">
          <div style="font-size:0.7rem;color:var(--color-text-muted);">${label}</div>
          <div style="font-weight:600;color:var(--color-text-primary);">${value}${unit}</div>
        </div>`;
    };

    const subjective = (label: string, val: number | undefined) => {
        if (!val) return '';
        const labels4 = ['最高', 'ナイス', '平均', 'いまいち'];
        const text = labels4[val - 1] || val;
        return `<div style="background:var(--color-bg);border-radius:var(--radius-sm);padding:4px 8px;">
          <div style="font-size:0.7rem;color:var(--color-text-muted);">${label}</div>
          <div style="font-weight:600;">${text}</div>
        </div>`;
    };

    const sleepStr = w.sleepSecs ? (() => {
        const h = Math.floor(w.sleepSecs / 3600);
        const m = Math.floor((w.sleepSecs % 3600) / 60);
        return `${h}h ${m}m`;
    })() : undefined;

    return [
        fmt('Fitness (CTL)', w.ctl !== undefined ? Math.round(w.ctl) : undefined),
        fmt('Fatigue (ATL)', w.atl !== undefined ? Math.round(w.atl) : undefined),
        fmt('Form (TSB)', w.tsb !== undefined ? Math.round(w.tsb) : undefined),
        fmt('安静時心拍', w.restingHR, ' bpm'),
        fmt('起床時心拍', w.wakingHR, ' bpm'),
        fmt('HRV (rMSSD)', w.hrv),
        fmt('HRV (SDNN)', w.hrv_sdnn),
        fmt('レディネス', w.readiness),
        fmt('SpO2', w.spO2, '%'),
        fmt('呼吸数', w.respiration, '/min'),
        fmt('睡眠中心拍', w.avgSleepingHR, ' bpm'),
        fmt('睡眠時間', sleepStr),
        fmt('睡眠スコア', w.sleepScore),
        fmt('体重', w.weight, ' kg'),
        fmt('体脂肪', w.bodyFat, '%'),
        fmt('VO2 Max', w.vo2max),
        fmt('摂取kcal', w.kcalConsumed, ' kcal'),
        fmt('水分補給量', w.hydrationVolume, ' L'),
        fmt('血糖値', w.bloodGlucose),
        fmt('収縮期血圧', w.systolic),
        fmt('拡張期血圧', w.diastolic),
        fmt('乳酸', w.lactate),
        fmt('歩数', w.steps),
        subjective('睡眠の質', w.sleepQuality),
        subjective('疲労感', w.fatigue),
        subjective('ストレス', w.stress),
        subjective('痛み', w.soreness),
        subjective('気分', w.mood),
        subjective('モチベーション', w.motivation),
        subjective('水分感', w.hydration),
    ].filter(s => s !== '').join('');
}

export function initCalendar() {
    let baseDate = new Date();

    const popover = document.getElementById('wellness-popover');
    const popoverDate = document.getElementById('wellness-popover-date');
    const popoverContent = document.getElementById('wellness-popover-content');

    document.getElementById('wellness-popover-close')?.addEventListener('click', () => {
        if (popover) popover.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (popover && popover.style.display !== 'none') {
            if (!popover.contains(target) && !target.classList.contains('wellness-badge') && !target.closest('.wellness-badge')) {
                popover.style.display = 'none';
            }
        }
    });

    const loadCalendarData = async () => {
        const container = document.getElementById('calendar-grid-container');
        const dRange = document.getElementById('calendar-date-range-display');
        if (!container || !dRange) return;

        const endOfWeek = new Date(baseDate);
        const day = endOfWeek.getDay();
        const diffToSunday = day === 0 ? 0 : 7 - day;
        endOfWeek.setDate(endOfWeek.getDate() + diffToSunday);
        endOfWeek.setHours(23, 59, 59, 999);

        const startOfWeekStr = new Date(endOfWeek.getTime() - (28 * 24 * 60 * 60 * 1000) + 1000);

        const oldest = startOfWeekStr.toISOString().split('T')[0];
        const newest = endOfWeek.toISOString().split('T')[0];

        dRange.textContent = `${oldest.replace(/-/g, '/')} 〜 ${newest.replace(/-/g, '/')}`;

        try {
            // Fetch both activities and wellness in parallel
            const [activities, wellnessData, hevyWorkouts] = await Promise.all([
                fetchActivities(oldest, newest),
                fetchWellness(oldest, newest),
                fetchHevyWorkouts()
            ]);

            const scheduledWorkouts = JSON.parse(storage.getItem('scheduled_workouts') || '[]');

            // Build a date-indexed wellness map
            // Intervals.icu API: wellness entries use `id` as the date string (e.g. "2026-03-10")
            const wellnessMap = new Map<string, IntervalsWellness>();
            wellnessData.forEach(w => {
                // Try all possible date field names the API might return
                const key: string | undefined = 
                    (typeof w.id === 'string' && /^\d{4}-\d{2}-\d{2}/.test(w.id) ? w.id : undefined) ||
                    (typeof w.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(w.date) ? w.date.substring(0, 10) : undefined) ||
                    Object.values(w).find((v): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))?.substring(0, 10);
                if (key) {
                    wellnessMap.set(key.substring(0, 10), w);
                }
            });

            const weeksHtml: string[] = [];
            let current = new Date(startOfWeekStr);

            for (let w = 0; w < 4; w++) {
                const daysHtml: string[] = [];
                let weekTss = 0;
                let weekTime = 0;

                for (let d = 0; d < 7; d++) {
                    const dateStrLocal = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');
                    const dayActs = activities.filter(a => a.start_date_local.startsWith(dateStrLocal));
                    const dayHevy = hevyWorkouts.filter(h => h.start_time.startsWith(dateStrLocal));
                    const wellness = wellnessMap.get(dateStrLocal);

                    const dayActsRemaining = [...dayActs];

                    const hevyHtml = dayHevy.map(hw => {
                        const t1 = new Date(hw.start_time).getTime();
                        const t2 = new Date(hw.end_time).getTime();
                        const movingTime = (t2 - t1) / 1000;
                        weekTime += movingTime || 0;
                        
                        const hrs = Math.floor(movingTime / 3600);
                        const mins = Math.floor((movingTime % 3600) / 60);
                        const duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

                        // Match Intervals WeightTraining
                        const matchingActIndex = dayActsRemaining.findIndex(a => {
                            if (a.type !== 'WeightTraining') return false;
                            const aTime = new Date(a.start_date_local).getTime();
                            return Math.abs(aTime - t1) < 4 * 60 * 60 * 1000;
                        });

                        let matchingActId = '';
                        let matchingTss = 0;
                        if (matchingActIndex !== -1) {
                            const act = dayActsRemaining.splice(matchingActIndex, 1)[0];
                            matchingActId = act.id;
                            matchingTss = act.icu_training_load || act.tss || 0;
                            weekTss += matchingTss;
                        }

                        return `
                          <div class="calendar-activity hevy-workout" data-id="hevy-${hw.id}" data-intervals-id="${matchingActId}" style="cursor: pointer; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            <div class="calendar-activity-bar">
                              <div class="zone" style="width:100%; background:#8B5CF6;"></div>
                            </div>
                            <div class="calendar-activity-detail" title="${hw.title}">
                              <span style="font-size: 0.65rem; background: var(--color-success); color: white; padding: 2px 4px; border-radius: 4px; margin-right: 4px; vertical-align: middle;">完了</span>
                              <span style="display:inline-block; width:14px; height:14px; vertical-align:middle; margin-right:2px; color:var(--color-primary);">${icons.weight}</span>
                              ${duration} (Hevy) ${matchingTss ? Math.round(matchingTss) + ' TSS' : ''}
                            </div>
                          </div>
                        `;
                    }).join('');

                    let dayTss = 0;
                    
                    const actsHtml = dayActsRemaining.map(act => {
                        const tssVal = act.icu_training_load || act.tss || 0;
                        dayTss += tssVal;
                        weekTss += tssVal;
                        weekTime += act.moving_time || 0;

                        const hrs = Math.floor((act.moving_time || 0) / 3600);
                        const mins = Math.floor(((act.moving_time || 0) % 3600) / 60);
                        const duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                        const isRide = act.type === 'Ride' || act.type === 'VirtualRide';

                        const npStr = act.normalized_watts ? ` ⚡${Math.round(act.normalized_watts)}W` : '';
                        const hrStr = act.average_heartrate ? ` ❤${Math.round(act.average_heartrate)}` : '';

                        return `
                          <div class="calendar-activity" data-id="${act.id}" style="cursor: pointer; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            <div class="calendar-activity-bar">
                              <div class="zone" style="width:100%; background:${isRide ? zoneColors['z2'] : zoneColors['z3']};"></div>
                            </div>
                            <div class="calendar-activity-detail" title="${act.name}">
                               <span style="font-size: 0.65rem; background: var(--color-success); color: white; padding: 2px 4px; border-radius: 4px; margin-right: 4px; vertical-align: middle;">完了</span>
                               <span style="display:inline-block; width:14px; height:14px; vertical-align:middle; margin-right:2px; color:var(--color-primary);">
                                 ${(() => {
                                    if (act.type === 'Run') return icons.run;
                                    if (act.type === 'VirtualRide' || act.type === 'IndoorCycle' || act.name.includes('屋内')) return icons.indoorBike;
                                    if (isRide) return icons.bike;
                                    return icons.weight;
                                 })()}
                               </span>
                               ${duration} ${tssVal ? Math.round(tssVal) + ' TSS' : ''}${npStr}${hrStr}
                            </div>
                          </div>
                        `;
                    }).join('');

                    const hevyDOMRegex = /data-intervals-id="([^"]+)"/g;
                    let m: RegExpExecArray | null;
                    while((m = hevyDOMRegex.exec(hevyHtml)) !== null) {
                        if (m && m[1]) {
                             const a = activities.find(x => x.id === m![1]);
                             if (a) dayTss += (a.icu_training_load || a.tss || 0);
                        }
                    }

                    // Scheduled workouts for this day
                    const dayScheduled = scheduledWorkouts.filter((sw: any) => sw.date === dateStrLocal);
                    const scheduledHtml = dayScheduled.map((sw: any) => {
                        return `
                          <div class="calendar-activity scheduled-workout" data-id="${sw.id}" data-plan-id="${sw.planId || ''}" style="
                            cursor: pointer; 
                            border: 1px dashed var(--color-primary); 
                            background: var(--color-bg); 
                            margin-top: 4px;
                            transition: transform 0.1s;
                          " title="予定: ${sw.description}" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            <div class="calendar-activity-detail" style="color: var(--color-primary);">
                               <span style="font-size: 0.65rem; background: var(--color-primary); color: white; padding: 2px 4px; border-radius: 4px; margin-right: 4px; vertical-align: middle;">予定</span>
                               <span style="display:inline-block; width:14px; height:14px; vertical-align:middle; margin-right:2px; color:var(--color-primary);">${icons.calendar}</span>
                               ${sw.title}
                            </div>
                          </div>
                        `;
                    }).join('');

                    // Wellness mini-badge (if data exists for the day)
                    let wellnessBadgeHtml = '';
                    if (wellness) {
                        const rhr = wellness.restingHR ? `❤${wellness.restingHR}` : '';
                        const hrv = wellness.hrv ? `HRV${Math.round(wellness.hrv)}` : '';
                        const ctl = wellness.ctl ? `CTL${Math.round(wellness.ctl)}` : '';
                        const summary = [rhr, hrv, ctl].filter(Boolean).join(' · ');
                        wellnessBadgeHtml = `
                          <div class="wellness-badge" data-date="${dateStrLocal}" style="
                            margin-top: 4px;
                            padding: 2px 6px;
                            background: linear-gradient(135deg, rgba(167,139,250,0.15), rgba(96,165,250,0.15));
                            border: 1px solid rgba(167,139,250,0.3);
                            border-radius: 4px;
                            font-size: 0.6rem;
                            color: var(--color-text-muted);
                            cursor: pointer;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                          " title="ウェルネス詳細を表示">
                            💜 ${summary || 'ウェルネスあり'}
                          </div>
                        `;
                    }

                    const isTodayFlag = isToday(`${current.getMonth() + 1}/${current.getDate()}`);

                    daysHtml.push(`
                      <div class="calendar-day ${isTodayFlag ? 'today' : ''}">
                        <div class="calendar-day-header">
                          <span class="calendar-day-date">${current.getMonth() + 1}/${current.getDate()}</span>
                          ${dayTss > 0 ? `<span class="calendar-day-tss">TSS ${Math.round(dayTss)}</span>` : ''}
                        </div>
                        ${actsHtml}
                        ${hevyHtml}
                        ${scheduledHtml}
                        ${wellnessBadgeHtml}
                      </div>
                    `);

                    current.setDate(current.getDate() + 1);
                }

                const weekHrs = Math.floor(weekTime / 3600);
                const weekMins = Math.floor((weekTime % 3600) / 60);

                weeksHtml.push(`
                  <div class="calendar-week">
                    <div class="calendar-week-header">
                      W${w + 1} <span>${weekHrs}h ${weekMins}m / TSS ${Math.round(weekTss)}</span>
                    </div>
                    <div class="calendar-days">
                      ${daysHtml.join('')}
                    </div>
                  </div>
                `);
            }

            container.innerHTML = weeksHtml.join('');

            // Attach click events to activities
            container.querySelectorAll('.calendar-activity:not(.hevy-workout):not(.scheduled-workout)').forEach(el => {
                el.addEventListener('click', (e) => {
                    const id = (e.currentTarget as HTMLElement).dataset.id;
                    const activity = activities.find(a => a.id === id);
                    if (activity) {
                        showActivityModal(activity);
                    }
                });
            });

            // Attach click events to Hevy
            container.querySelectorAll('.hevy-workout').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const hwId = (e.currentTarget as HTMLElement).dataset.id?.replace('hevy-', '');
                    const intervalsId = (e.currentTarget as HTMLElement).dataset.intervalsId;
                    const hw = hevyWorkouts.find(h => h.id === hwId);
                    const matchingAct = activities.find(a => a.id === intervalsId);
                    if (hw) {
                        showHevyModal(hw, matchingAct);
                    }
                });
            });

            // Attach click events to scheduled workouts
            container.querySelectorAll('.scheduled-workout').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = (e.currentTarget as HTMLElement).dataset.id;
                    const workout = scheduledWorkouts.find((sw: any) => sw.id === id);
                    if (workout) {
                        showScheduledWorkoutModal(workout);
                    }
                });
            });

            // Wellness badge click → show popover
            container.querySelectorAll('.wellness-badge').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const date = (e.currentTarget as HTMLElement).dataset.date;
                    if (!date || !popover || !popoverDate || !popoverContent) return;

                    const wellness = wellnessMap.get(date);
                    if (!wellness) return;

                    popoverDate.textContent = `${date} のウェルネス`;
                    const content = formatWellnessPopover(wellness);
                    popoverContent.innerHTML = content || '<div style="color:var(--color-text-muted);">データなし</div>';

                    // Positioning the popover near the clicked badge
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    let left = rect.left + window.scrollX;
                    let top = rect.bottom + window.scrollY + 4;

                    // Keep within viewport
                    if (left + 280 > window.innerWidth) left = window.innerWidth - 290;
                    popover.style.left = `${left}px`;
                    popover.style.top = `${top}px`;
                    popover.style.display = 'block';
                });
            });

        } catch (error) {
            console.error(error);
            container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--color-danger);">データの読み込みに失敗しました</div>`;
        }
    };

    loadCalendarData();

    document.getElementById('cal-prev')?.addEventListener('click', () => {
        baseDate.setDate(baseDate.getDate() - 28);
        loadCalendarData();
    });

    document.getElementById('cal-next')?.addEventListener('click', () => {
        baseDate.setDate(baseDate.getDate() + 28);
        loadCalendarData();
    });

    document.getElementById('cal-today')?.addEventListener('click', () => {
        baseDate = new Date();
        loadCalendarData();
    });

    document.getElementById('cal-sync')?.addEventListener('click', async () => {
        const btn = document.getElementById('cal-sync') as HTMLButtonElement;
        const original = btn.innerHTML;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg> 同期中...`;
        btn.disabled = true;
        await loadCalendarData();
        btn.innerHTML = original;
        btn.disabled = false;
    });

    // Also update the AI context with fetched wellness data for later AI use
}
