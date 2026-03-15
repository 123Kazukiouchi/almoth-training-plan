import type { IntervalsActivity } from '../services/intervalsSync';

/**
 * Custom Training Load Calculation (Fitness/Fatigue/Form)
 * Uses Exponential Weighted Moving Average (EWMA) formulas.
 */

export interface TrainingLoadMetrics {
    ctl: number; // Fitness (42-day average)
    atl: number; // Fatigue (7-day average)
    tsb: number; // Form (CTL - ATL)
}

export interface DailyLoad {
    date: string;
    tss: number;
}

/**
 * Calculates Fitness (CTL), Fatigue (ATL), and Form (TSB) from a series of TSS values.
 * @param dailyLoads Array of {date, tss} sorted by date ascending.
 * @returns Map of date string to Metrics
 */
export function calculateHistory(dailyLoads: DailyLoad[]): Map<string, TrainingLoadMetrics> {
    const history = new Map<string, TrainingLoadMetrics>();
    
    let ctl = 0;
    let atl = 0;

    // To allow for a "starting point" if the user has data before current fetch range
    // In a real app, we might seed this from Intervals.icu wellness.

    for (const day of dailyLoads) {
        // Form is CTL - ATL of YESTERDAY
        const form = ctl - atl;
        
        // CTL (Chronic Training Load) - 42 day constant
        ctl = ctl + (day.tss - ctl) / 42;
        
        // ATL (Acute Training Load) - 7 day constant
        atl = atl + (day.tss - atl) / 7;

        history.set(day.date, {
            ctl: Math.round(ctl * 10) / 10,
            atl: Math.round(atl * 10) / 10,
            tsb: Math.round(form * 10) / 10
        });
    }

    return history;
}

/**
 * Aggregates deduplicated activities into daily TSS totals.
 */
export function aggregateDailyTss(activities: IntervalsActivity[]): DailyLoad[] {
    const dailyMap = new Map<string, number>();

    activities.forEach(act => {
        const date = act.start_date_local.split('T')[0];
        const load = act.icu_training_load || act.tss || 0;
        dailyMap.set(date, (dailyMap.get(date) || 0) + load);
    });

    // Sort by date ascending
    return Array.from(dailyMap.keys())
        .sort((a, b) => a.localeCompare(b))
        .map(date => ({
            date,
            tss: dailyMap.get(date) || 0
        }));
}

/**
 * Fill gaps in daily loads (days with 0 TSS should still decay CTL/ATL)
 */
export function fillDailyGaps(loads: DailyLoad[]): DailyLoad[] {
    if (loads.length === 0) return [];

    const result: DailyLoad[] = [];
    const sorted = [...loads].sort((a, b) => a.date.localeCompare(b.date));
    
    let current = new Date(sorted[0].date);
    const end = new Date(sorted[sorted.length - 1].date);
    
    const loadMap = new Map(sorted.map(l => [l.date, l.tss]));

    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            tss: loadMap.get(dateStr) || 0
        });
        current.setDate(current.getDate() + 1);
    }

    return result;
}
