// Intervals.icu API integration service

const BASE_URL = 'https://intervals.icu/api/v1';

export interface IntervalsProfile {
    id: string;
    name: string;
    email: string;
    ftp: number;
    weight: number;
    restingHR: number;
    maxHR: number;
    [key: string]: any;
}

export interface IntervalsWellness {
    id: string; // date string e.g. "2026-03-10"
    date: string;
    
    // =====================================================================
    // 可動能CTL/ATL/TSB
    // =====================================================================
    ctl?: number;        // Fitness (Chronic Training Load)
    atl?: number;        // Fatigue (Acute Training Load)
    tsb?: number;        // Form (Training Stress Balance)
    rampRate?: number;   // ランプレート

    // =====================================================================
    // 心拍 / HRV
    // =====================================================================
    restingHR?: number;   // 安静時心拍数 (bpm)
    wakingHR?: number;    // 起床時心拍数 (bpm)
    hrv?: number;         // HRV rMSSD
    hrv_sdnn?: number;    // HRV SDNN
    hrvScore?: number;    // Baevsky SI
    readiness?: number;   // レディネス
    spO2?: number;        // SpO2 (%)
    respiration?: number; // 呼吼数 (breaths/min)
    avgSleepingHR?: number; // 睡眠中心拍

    // =====================================================================
    // 体組成
    // =====================================================================
    weight?: number;      // 体重 (kg)
    bodyFat?: number;     // 体脂肪 (%)
    vo2max?: number;      // VO2 Max

    // =====================================================================
    // 睡眠
    // =====================================================================
    sleepSecs?: number;   // 睡眠時間 (秒)
    sleepScore?: number;  // 睡眠スコア (0-100)
    sleepQuality?: number;// 1-4 (最高/ナイス/平均/いまいち)

    // =====================================================================
    // 主訳的コンディション
    // =====================================================================
    soreness?: number;    // 1-4 痛み
    fatigue?: number;     // 1-4 ファティーグ
    stress?: number;      // 1-4 ストレス
    mood?: number;        // 1-4 気分
    motivation?: number;  // 1-4 モチベーション
    menstrualPhase?: string; // 月経周期
    injury?: number;      // 1-4 ケガ

    // =====================================================================
    // 栄養 / 水分
    // =====================================================================
    kcalConsumed?: number;    // 摄取kcal
    hydration?: number;       // 1-4 主観的水分補給
    hydrationVolume?: number; // 水分補給量 (L)

    // =====================================================================
    // 全身生理指標
    // =====================================================================
    systolic?: number;    // 収縮期血圧
    diastolic?: number;   // 拡張期血圧
    bloodGlucose?: number;// 血糖値
    lactate?: number;     // 乳酸
    steps?: number;       // 歩数

    // その他の全フィールドを保持する
    [key: string]: any;
}

export interface IntervalsActivity {
    id: string;
    start_date_local: string;
    name: string;
    type: string;
    moving_time: number; // 秒
    elapsed_time: number; // 秒
    distance: number; // メートル
    total_elevation_gain?: number; // 獲得標高 (メートル)
    
    // 負荷指標
    icu_training_load?: number; // TSS (Intervals側で計算された優先TSS)
    tss?: number; // 予備TSS
    icu_intensity?: number; // IF (Intensity Factor)
    icu_ftp?: number; // このアクティビティ時のFTP設定値
    
    // パワー・心拍・その他数値
    average_watts?: number; // 平均パワー
    normalized_watts?: number; // NP (Normalized Power)
    max_watts?: number; // 最大パワー
    average_heartrate?: number; // 平均心拍数
    max_heartrate?: number; // 最大心拍数
    hrrc?: number; // HRRc (心拍回復)
    trimp?: number; // TRIMP
    
    average_cadence?: number; // 平均ケイデンス
    average_speed?: number; // 平均速度 (m/s)
    max_speed?: number; // 最大速度 (m/s)
    calories?: number; // カロリー
    work?: number; // ワーク (kJ)
    
    // 主観的指標
    rpe?: number; // RPE (主観的運動強度)
    srpe?: number; // sRPE
    feel?: number; // 気分 (1-4)
    
    // ペダリング/効率・その他
    icu_efficiency_factor?: number; // EF (効率)
    icu_variability_index?: number; // VI (パワー変動)
    icu_power_hr?: number; // Pw:HR
    average_lr_balance?: number; // L/Rバランス
    
    // ゾーン滞在時間 (配列)
    icu_zone_times?: number[]; // [Z1秒, Z2秒, Z3秒...] 等
    icu_power_zones?: number[]; // 設定パワーゾーン閾値
    icu_hr_zones?: number[]; // 設定HRゾーン閾値
    
    // その他
    source?: string; // データソース (Strava, Garmin, etc)
    device_name?: string; // 使用デバイス
    [key: string]: any; // その他の未知の全フィールドを保持
}

/**
 * 認証ヘッダーを生成する
 */
function getAuthHeaders(apiKey: string): Headers {
    const headers = new Headers();
    // Intervals.icu uses "API_KEY" as username and the actual key as the password for basic auth
    const encoded = btoa(`API_KEY:${apiKey}`);
    headers.append('Authorization', `Basic ${encoded}`);
    headers.append('Accept', 'application/json');
    return headers;
}

/**
 * APIキーとアスリートIDを使って接続テストを兼ねてプロフィールを取得する
 */
export async function fetchAthleteProfile(athleteId: string, apiKey: string): Promise<IntervalsProfile | null> {
    try {
        const response = await fetch(`${BASE_URL}/athlete/${athleteId}`, {
            method: 'GET',
            headers: getAuthHeaders(apiKey),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('認証に失敗しました。アスリートIDとAPIキーを確認してください。');
            }
            throw new Error(`APIエラー: ${response.status}`);
        }

        const data = await response.json();
        return data as IntervalsProfile;
    } catch (error) {
        console.error('Error fetching Intervals.icu profile:', error);
        throw error;
    }
}

/**
 * 保存されている認証情報を使ってプロフィールを取得する
 */
export async function syncIntervalsData(): Promise<boolean> {
    const athleteId = localStorage.getItem('intervals_athlete_id');
    const apiKey = localStorage.getItem('intervals_api_key');

    if (!athleteId || !apiKey) {
        throw new Error('認証情報が設定されていません。設定画面で入力してください。');
    }

    try {
        const profile = await fetchAthleteProfile(athleteId, apiKey);
        if (profile) {
            // 取得したFTPや体重などを保存（既存の設定を上書きまたはマージ）
            // intervals APIはフィールド名が ftp だったり icu_ftp だったりするためfallback
            const ftp = profile.ftp || profile.icu_ftp;
            const weight = profile.weight || profile.icu_weight;
            const maxHR = profile.maxHR || profile.max_hr || profile.icu_max_hr;

            if (ftp) localStorage.setItem('user_ftp', ftp.toString());
            if (weight) localStorage.setItem('user_weight', weight.toString());
            if (maxHR) localStorage.setItem('user_max_hr', maxHR.toString());

            console.log('Intervals.icuからのデータ同期が完了しました:', profile);
            return true;
        }
        return false;
    } catch (error) {
        throw error;
    }
}

/**
 * 期間指定でウェルネスデータ(Fitness/Fatigue/Form等)を取得する
 * GET /api/v1/athlete/{id}/wellness{?oldest,newest}
 */
export async function fetchWellness(oldest: string, newest: string): Promise<IntervalsWellness[]> {
    const athleteId = localStorage.getItem('intervals_athlete_id');
    const apiKey = localStorage.getItem('intervals_api_key');

    if (!athleteId || !apiKey) return [];

    try {
        const response = await fetch(`${BASE_URL}/athlete/${athleteId}/wellness?oldest=${oldest}&newest=${newest}`, {
            method: 'GET',
            headers: getAuthHeaders(apiKey),
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        return await response.json() as IntervalsWellness[];
    } catch (error) {
        console.error('Error fetching wellness:', error);
        return [];
    }
}

/**
 * 期間指定でアクティビティを取得する
 * GET /api/v1/athlete/{id}/activities{?oldest,newest}
 */
export async function fetchActivities(oldest: string, newest: string): Promise<IntervalsActivity[]> {
    const athleteId = localStorage.getItem('intervals_athlete_id');
    const apiKey = localStorage.getItem('intervals_api_key');

    if (!athleteId || !apiKey) return [];

    try {
        const response = await fetch(`${BASE_URL}/athlete/${athleteId}/activities?oldest=${oldest}&newest=${newest}`, {
            method: 'GET',
            headers: getAuthHeaders(apiKey),
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const rawActivities = await response.json() as IntervalsActivity[];
        
        // 1. ソースでフィルタリング
        const validSourcesStr = localStorage.getItem('valid_activity_sources');
        let filtered = rawActivities;
        if (validSourcesStr) {
            const validSources = validSourcesStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
            if (validSources.length > 0) {
                filtered = filtered.filter(act => {
                    const source = (act.source || '').toLowerCase();
                    const deviceName = (act.device_name || '').toLowerCase();
                    return validSources.some(vs => source.includes(vs) || deviceName.includes(vs));
                });
            }
        }
        
        // 2. 自動重複排除
        const deduplicated: IntervalsActivity[] = [];
        for (const act of filtered) {
            const actTime = new Date(act.start_date_local).getTime();
            const actDuration = act.moving_time || act.elapsed_time || 0;
            
            const duplicateIndex = deduplicated.findIndex(existing => {
                const exTime = new Date(existing.start_date_local).getTime();
                const exDuration = existing.moving_time || existing.elapsed_time || 0;
                
                const timeDiffMinutes = Math.abs(actTime - exTime) / (1000 * 60);
                const durationDiffMinutes = Math.abs(actDuration - exDuration) / 60;
                
                // 開始時刻が前後15分以内かつ、継続時間が前後15分以内を重複とみなす
                return timeDiffMinutes <= 15 && durationDiffMinutes <= 15;
            });
            
            if (duplicateIndex !== -1) {
                // 重複がある場合、TSSが高い方を優先する
                const existing = deduplicated[duplicateIndex];
                const existingLoad = existing.icu_training_load || existing.tss || 0;
                const newLoad = act.icu_training_load || act.tss || 0;
                
                if (newLoad > existingLoad) {
                    deduplicated[duplicateIndex] = act;
                }
            } else {
                deduplicated.push(act);
            }
        }
        
        return deduplicated;
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}

/**
 * 1つのアクティビティの「深い」詳細データ（ストリーム、ラップ、パワーゾーン等）を取得する
 * GET /api/v1/activity/{id}
 */
export async function fetchActivityDetails(activityId: string): Promise<any> {
    const apiKey = localStorage.getItem('intervals_api_key');
    if (!apiKey) return null;

    try {
        const response = await fetch(`${BASE_URL}/activity/${activityId}`, {
            method: 'GET',
            headers: getAuthHeaders(apiKey),
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching activity details:', error);
        return null;
    }
}
