// Mock data for the training plan application

export interface MetricData {
    label: string;
    labelEn: string;
    value: number | string;
    sub: string;
    iconColor: string;
}

export interface Activity {
    name: string;
    duration: string;
    power?: string;
    tss: number;
    zones: { zone: string; pct: number }[];
}

export interface DayData {
    date: string;
    dayNum: number;
    tss: number;
    activities: Activity[];
}

export interface WeekData {
    weekNum: number;
    totalTime: string;
    totalTss: number;
    days: DayData[];
}

export const metrics: MetricData[] = [
    { label: 'Fitness (体力)', labelEn: 'Chronic Training Load', value: 66.3, sub: 'Chronic Training Load', iconColor: '#10B981' },
    { label: 'Fatigue (疲労)', labelEn: 'Acute Training Load', value: 74.0, sub: 'Acute Training Load', iconColor: '#3B82F6' },
    { label: 'Form (調子)', labelEn: 'Training Stress Balance', value: -7.7, sub: 'Training Stress Balance', iconColor: '#A855F7' },
    { label: '安静時HR', labelEn: 'Resting Heart Rate', value: 49, sub: 'Resting Heart Rate', iconColor: '#EC4899' },
    { label: 'FTP', labelEn: 'Estimated FTP (W)', value: 211, sub: 'Estimated FTP (W)', iconColor: '#F97316' },
];

// Generate 90 days of chart data
export function generateChartData() {
    const labels: string[] = [];
    const fitness: number[] = [];
    const fatigue: number[] = [];
    const form: number[] = [];
    const hr: number[] = [];
    const ftp: number[] = [];

    const baseDate = new Date(2025, 11, 12); // Dec 12
    let f = 62, a = 60;

    for (let i = 0; i < 90; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        labels.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`);

        // Simulate realistic training load trends
        const weekDay = d.getDay();
        const isRestDay = weekDay === 0 || weekDay === 4;
        const isHardDay = weekDay === 2 || weekDay === 6;

        if (isHardDay) {
            a += Math.random() * 8 + 2;
        } else if (isRestDay) {
            a -= Math.random() * 6 + 2;
        } else {
            a += (Math.random() - 0.5) * 6;
        }
        f = f * 0.98 + a * 0.02;
        a = Math.max(15, Math.min(130, a));
        f = Math.max(35, Math.min(100, f));

        fitness.push(Math.round(f * 10) / 10);
        fatigue.push(Math.round(a * 10) / 10);
        form.push(Math.round((f - a) * 10) / 10);
        hr.push(Math.round(47 + Math.sin(i * 0.15) * 5 + Math.random() * 3));
        ftp.push(Math.round(205 + i * 0.07 + Math.sin(i * 0.1) * 3));
    }

    return { labels, fitness, fatigue, form, hr, ftp };
}

// Activity types
const activityTypes = [
    { name: '室内バイク', icon: '🚴' },
    { name: '筋トレ', icon: '💪' },
    { name: '屋外バイク', icon: '🚲' },
    { name: 'ウォーク', icon: '🚶' },
    { name: 'ピラティス', icon: '🧘' },
    { name: 'ロードサイクリング', icon: '🚴‍♂️' },
];

function randomZones(): { zone: string; pct: number }[] {
    const zones = ['z1', 'z2', 'z3', 'z4', 'z5', 'z6'];
    const result: { zone: string; pct: number }[] = [];
    let remaining = 100;

    for (let i = 0; i < zones.length - 1; i++) {
        if (remaining <= 0) break;
        const pct = Math.floor(Math.random() * (remaining / 2));
        if (pct > 5) {
            result.push({ zone: zones[i], pct });
            remaining -= pct;
        }
    }
    if (remaining > 0) {
        result.push({ zone: zones[Math.floor(Math.random() * 3)], pct: remaining });
    }

    return result;
}

export function generateCalendarData(): WeekData[] {
    const weeks: WeekData[] = [];
    const baseDate = new Date(2026, 1, 9); // Feb 9, 2026

    for (let w = 0; w < 4; w++) {
        const days: DayData[] = [];
        let weekTss = 0;
        let weekMinutes = 0;

        for (let d = 0; d < 7; d++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + w * 7 + d);
            const dayOfWeek = date.getDay();
            const isRest = dayOfWeek === 0 || (dayOfWeek === 4 && Math.random() > 0.5);

            const activities: Activity[] = [];

            if (!isRest) {
                const numActivities = Math.random() > 0.6 ? 2 : 1;
                for (let a = 0; a < numActivities; a++) {
                    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
                    const duration = Math.floor(40 + Math.random() * 80);
                    const power = type.name.includes('バイク') || type.name.includes('サイクリング')
                        ? `${Math.floor(90 + Math.random() * 110)}W` : undefined;
                    const tss = Math.floor(20 + Math.random() * 130);

                    activities.push({
                        name: type.name,
                        duration: `${Math.floor(duration / 60)}h${String(duration % 60).padStart(2, '0')}m`,
                        power,
                        tss,
                        zones: randomZones(),
                    });
                    weekTss += tss;
                    weekMinutes += duration;
                }
            }

            const dayTss = activities.reduce((sum, a) => sum + a.tss, 0);
            days.push({
                date: `${date.getMonth() + 1}/${date.getDate()}`,
                dayNum: date.getDate(),
                tss: dayTss,
                activities,
            });
        }

        const totalHours = Math.floor(weekMinutes / 60);
        const totalMins = weekMinutes % 60;
        weeks.push({
            weekNum: w + 1,
            totalTime: `${totalHours}h${String(totalMins).padStart(2, '0')}m`,
            totalTss: weekTss,
            days,
        });
    }

    return weeks;
}
