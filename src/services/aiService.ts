import { fetchWellness, fetchActivities, fetchActivityDetails } from './intervalsSync';
import { fetchHevyWorkouts } from './hevySync';
import { storage } from '../utils/storage';
import { aggregateDailyTss, fillDailyGaps, calculateHistory } from '../utils/trainingLoad';


// Dynamic URL generation will be done inside the request

/**
 * AIとのチャットメッセージ履歴を保持する配列
 */
let conversationHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [];

/**
 * 会話履歴を取得する
 */
export function getConversationHistory() {
    return conversationHistory;
}

/**
 * 会話履歴をリセットする
 */
export function resetConversation() {
    conversationHistory = [];
}

/**
 * ユーザーの現状の情報をIntervalsから集め、コンテキスト文字列を作成する
 */
async function buildUserContext(): Promise<string> {
    const athleteId = storage.getItem('intervals_athlete_id');
    const intervalsKey = storage.getItem('intervals_api_key');
    
    // 基本プロフィール
    const ftp = storage.getItem('user_ftp') || '未設定';
    const weight = storage.getItem('user_weight') || '未設定';
    const maxHr = storage.getItem('user_max_hr') || '未設定';


    let contextData = `
【ユーザー基本情報】
- FTP: ${ftp} W
- 体重: ${weight} kg
- 最大心拍数: ${maxHr} bpm

【現在の目標設定】
${(() => {
    const savedGoals = JSON.parse(storage.getItem('user_goals') || '[]');
    const activeGoalId = storage.getItem('active_goal_id');
    const activeGoal = savedGoals.find((g: any) => g.id === activeGoalId);
    if (!activeGoal) return "- 現在、アクティブな目標はありません。";
    return `- 目標名: ${activeGoal.name}\n- タイプ: ${activeGoal.type}\n- 期間: ${activeGoal.period}\n- 目標値: ${activeGoal.target || '未設定'}\n- メモ: ${activeGoal.memo || 'なし'}`;
})()}

【保存されているトレーニングプラン】
${(() => {
    const savedPlans = JSON.parse(storage.getItem('saved_plans') || '[]');
    if (savedPlans.length === 0) return "- 保存されたプランはありません。";
    return savedPlans.map((p: any) => `- ${p.title} (生成日: ${p.date})`).join('\n');
})()}
`;

    if (!athleteId || !intervalsKey) {
        contextData += `\n(※Intervals.icuが未連携のため、詳細な生データは取得できませんでした。基本プロフィールをもとにアドバイスしてください。)\n`;
        return contextData;
    }

    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const oldest = sevenDaysAgo.toISOString().split('T')[0];
        const newest = now.toISOString().split('T')[0];

        // 過去7日間のウェルネスとアクティビティ
        const [wellnessData, activitiesData, hevyData] = await Promise.all([
            fetchWellness(oldest, newest),
            fetchActivities(oldest, newest),
            fetchHevyWorkouts()
        ]);

        if (activitiesData.length > 0 || (hevyData && hevyData.length > 0)) {
            // 合併とソート
            const formattedHevy = (hevyData || []).map(hw => {
                const start = new Date(hw.start_time);
                const end = new Date(hw.end_time);
                const movingTime = Math.round((end.getTime() - start.getTime()) / 1000);
                return {
                    id: hw.id, start_date_local: hw.start_time, type: 'WeightTraining', name: hw.title, distance: 0,
                    moving_time: movingTime, elapsed_time: movingTime, icu_training_load: 0, tss: 0, normalized_watts: 0,
                    average_watts: 0, device_name: 'Hevy', source: 'Hevy'
                } as any;
            });
            const mergedActivities = [...activitiesData, ...formattedHevy].sort((a,b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());

            // 独自計算
            const dailyLoads = aggregateDailyTss(mergedActivities);
            const completeDailyLoads = fillDailyGaps(dailyLoads);
            const loadHistory = calculateHistory(completeDailyLoads);
            const todayStr = now.toISOString().split('T')[0];
            const accMetrics = loadHistory.get(todayStr) || { ctl: 0, atl: 0, tsb: 0 };

            contextData += `\n【最新のコンディション (正確な独自計算値)】\n`;
            contextData += `- Fitness (CTL): ${accMetrics.ctl} (42日平均負荷)\n`;
            contextData += `- Fatigue (ATL): ${accMetrics.atl} (7日平均負荷)\n`;
            contextData += `- Form (TSB): ${accMetrics.tsb} (疲労と体力のバランス)\n`;

            const latestW = wellnessData[wellnessData.length - 1] || {};
            contextData += `\n【その他の生体データ (最新)】\n`;
            if (latestW.restingHR) contextData += `- 安静時心拍数: ${latestW.restingHR} bpm\n`;
            if (latestW.wakingHR) contextData += `- 起床時心拍数: ${latestW.wakingHR} bpm\n`;
            if (latestW.hrv) contextData += `- HRV (rMSSD): ${latestW.hrv}\n`;
            if (latestW.hrv_sdnn) contextData += `- HRV (SDNN): ${latestW.hrv_sdnn}\n`;
            if (latestW.hrvScore) contextData += `- Baevsky SI: ${latestW.hrvScore}\n`;
            if (latestW.readiness) contextData += `- レディネス: ${latestW.readiness}\n`;
            if (latestW.spO2) contextData += `- SpO2: ${latestW.spO2}%\n`;
            if (latestW.avgSleepingHR) contextData += `- 睡眠中心拍: ${latestW.avgSleepingHR} bpm\n`;
            if (latestW.respiration) contextData += `- 呼吼数: ${latestW.respiration}/min\n`;
            // Sleep
            if (latestW.sleepSecs) {
                const h = Math.floor(latestW.sleepSecs / 3600);
                const m = Math.floor((latestW.sleepSecs % 3600) / 60);
                contextData += `- 睡眠時間: ${h}h ${m}m\n`;
            }
            if (latestW.sleepScore) contextData += `- 睡眠スコア: ${latestW.sleepScore}\n`;
            // Body composition
            if (latestW.weight) contextData += `- 体重: ${latestW.weight} kg\n`;
            if (latestW.bodyFat) contextData += `- 体脂肪: ${latestW.bodyFat}%\n`;
            if (latestW.vo2max) contextData += `- VO2 Max: ${latestW.vo2max}\n`;
            // Nutrition
            if (latestW.kcalConsumed) contextData += `- 摂取kcal: ${latestW.kcalConsumed} kcal\n`;
            if (latestW.hydrationVolume) contextData += `- 水分補給量: ${latestW.hydrationVolume} L\n`;
            // Physiology
            if (latestW.systolic && latestW.diastolic) contextData += `- 血圧: ${latestW.systolic}/${latestW.diastolic} mmHg\n`;
            if (latestW.bloodGlucose) contextData += `- 血糖値: ${latestW.bloodGlucose}\n`;
            if (latestW.lactate) contextData += `- 乳酸: ${latestW.lactate}\n`;
            if (latestW.steps) contextData += `- 歩数: ${latestW.steps.toLocaleString()}\n`;
            // Subjective condition
            const subjMap: Record<number,string> = {1:'最高',2:'ナイス',3:'平均',4:'いまいち'};
            if (latestW.fatigue) contextData += `- 疲労気(主観): ${subjMap[latestW.fatigue] || latestW.fatigue}\n`;
            if (latestW.soreness) contextData += `- 痛み: ${subjMap[latestW.soreness] || latestW.soreness}\n`;
            if (latestW.stress) contextData += `- ストレス: ${subjMap[latestW.stress] || latestW.stress}\n`;
            if (latestW.mood) contextData += `- 気分: ${subjMap[latestW.mood] || latestW.mood}\n`;
            if (latestW.motivation) contextData += `- モチベーション: ${subjMap[latestW.motivation] || latestW.motivation}\n`;
        }

        if (activitiesData.length > 0) {
            // 直近の最大5件のアクティビティ概要
            const recentActs = activitiesData.sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime()).slice(0, 5);
            contextData += `\n【最近5件のアクティビティ履歴】\n`;
            recentActs.forEach(act => {
                const date = new Date(act.start_date_local).toLocaleDateString();
                const np = act.normalized_watts ? `${Math.round(act.normalized_watts)}W` : '-';
                const hr = act.average_heartrate ? `${Math.round(act.average_heartrate)}bpm` : '-';
                contextData += `- ${date}: [${act.type}] ${act.name} (時間: ${Math.round(act.moving_time/60)}分, TSS: ${act.icu_training_load || act.tss || '-'}, NP: ${np}, 平均HR: ${hr})\n`;
            });

            // 最新1件に関しては、さらに「深い」生データを取得する
            const latestAct = recentActs[0];
            const deepDetails = await fetchActivityDetails(latestAct.id);
            if (deepDetails) {
                contextData += `\n【最新のワークアウトの詳細生データ (対象: ${latestAct.name})】\n`;
                // AIに解釈させるため、不要に巨大になりがちなストリーム系配列（1秒ごとのログ等）は除外または間引くか、
                // サマリーとなるゾーンデータやラップ情報などを抽出して渡す。
                if (deepDetails.icu_zone_times) {
                    contextData += `- ゾーン滞在時間(秒): ${JSON.stringify(deepDetails.icu_zone_times)}\n`;
                }
                if (deepDetails.icu_power_zones) {
                    contextData += `- 設定パワーゾーン: ${JSON.stringify(deepDetails.icu_power_zones)}\n`;
                }
                const hrZones = deepDetails.icu_hr_zones;
                if (hrZones) {
                    contextData += `- 設定HRゾーン: ${JSON.stringify(hrZones)}\n`;
                }
                if (deepDetails.calories) {
                    contextData += `- 消費カロリー: ${deepDetails.calories} kcal\n`;
                }
                if (deepDetails.icu_intensity) {
                    contextData += `- IF (Intensity Factor): ${(deepDetails.icu_intensity / 100).toFixed(2)}\n`;
                }
                if (deepDetails.icu_efficiency_factor) {
                    contextData += `- EF (Efficiency Factor - Power/HR): ${deepDetails.icu_efficiency_factor.toFixed(2)}\n`;
                }
                if (deepDetails.laps && deepDetails.laps.length > 0) {
                     // ラップサマリー（最大5ラップ程度）
                     const lapSummary = deepDetails.laps.slice(0, 5).map((l: any, i: number) => `Lap${i+1}(${Math.round(l.moving_time/60)}分, ${Math.round(l.average_watts || 0)}W, ${Math.round(l.average_heartrate || 0)}bpm)`).join(', ');
                     contextData += `- 主要ラップ: ${lapSummary}\n`;
                }
            }
        }

        if (hevyData && hevyData.length > 0) {
            const recentHevy = hevyData.sort((a,b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).slice(0, 3);
            contextData += `\n【最近のウェイトトレーニング (Hevy) 履歴】\n`;
            recentHevy.forEach(hw => {
               const date = new Date(hw.start_time).toLocaleDateString();
               let exercisesStr = hw.exercises.map(ex => {
                   const setsInfo = ex.sets.map(s => `${s.weight_kg}kg x ${s.reps}回`).join(', ');
                   return `    - ${ex.title}: ${setsInfo}`;
               }).join('\n');
               contextData += `- ${date}: ${hw.title}\n${exercisesStr}\n`;
            });
        }
    } catch (e) {
        console.error('Failed to fetch context for AI', e);
        contextData += `\n(※コンテキスト取得中にエラーが発生しましたが、過去のデータで分析を続けてください)\n`;
    }

    return contextData;
}

/**
 * Gemini APIにメッセージを送信し、返答を得る
 */
export async function generateAiResponse(userMessage: string): Promise<string> {
    const apiKey = storage.getItem('gemini_api_key');
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。設定画面から登録してください。');
    }

    const savedModel = storage.getItem('gemini_model') || 'gemini-1.5-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${savedModel}:generateContent`;


    try {
        // システムプロンプト（初回のみコンテキスト付きで指示を出す）
        let systemInstruction = "";
        if (conversationHistory.length === 0) {
            const contextStr = await buildUserContext();
            systemInstruction = `
あなたはプロの自転車競技・持久系スポーツの専属AIコーチです。
ユーザーは「Almoth Training Plan」というアプリを利用しています。

以下の【ユーザーの最新データコンテキスト】を深く分析し、ユーザーの質問や相談に対して、専門的かつ実践的なアドバイスやトレーニングプランの提案を行ってください。

【ユーザーの最新データコンテキスト】
${contextStr}

指示:
- 与えられたデータ（Fitness/Fatigue/Form、各ワークアウトのTSS/NP/IF/ゾーンデータ等）を分析の根拠として具体的に使ってください。
- 「先日のワークアウトではIFが〇〇で高めでしたね」「現在のFormが〇〇なので、今は○○な時期です」など、データに基づくパーソナルな会話を心がけてください。
- ユーザーに合致するウェイトトレーニングを提案する場合、具体的な種目名・重量・セット数・回数なども含めて指示・提案してください。
- 過去のトレーニング履歴（自転車や筋トレ）を分析し、マンネリ化を防ぐために同じメニューを避けた新しいバリエーションのトレーニングを提案してください。
- 日本語で、親しみやすくかつプロフェッショナルなトーンで回答してください。
- ユーザーに怪我の兆候がありそうな過度な疲労が見られる場合は警告を出してください。
- HTMLタグは使わず、マークダウン形式（**太字** など）で構造化して回答してください。
`;
        }

        // 会話履歴にユーザーのメッセージを追加
        conversationHistory.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        // APIリクエストボディの組み立て
        const requestBody: any = {
            contents: conversationHistory,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
            }
        };

        // 初回のみシステムプロンプトを付与
        if (systemInstruction) {
             requestBody.systemInstruction = {
                parts: [{ text: systemInstruction }]
             };
        }

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Gemini API Error (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) {
            throw new Error('AIからの有効な応答が得られませんでした。');
        }

        // 会話履歴にAIのメッセージを追加
        conversationHistory.push({
            role: 'model',
            parts: [{ text: aiText }]
        });

        return aiText;
    } catch (error: any) {
        console.error('Error in generateAiResponse:', error);
        
        // エラー時は、追加した履歴をポップして元に戻す（再試行できるように）
        if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'user') {
            conversationHistory.pop(); 
        }

        throw error;
    }
}

/**
 * 今日の予定とウェルネスデータをもとに、デイリーアドバイスを取得する
 */
export async function getDailyAdvice(wellness: any, workouts: any[], recentActivities?: any[]): Promise<string> {
    const apiKey = storage.getItem('gemini_api_key');
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。');
    }

    const savedModel = storage.getItem('gemini_model') || 'gemini-1.5-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${savedModel}:generateContent`;


    let wellnessStr = '(データなし)';
    if (wellness && Object.keys(wellness).length > 0) {
        // もしCTLなどがwellnessの中に不鮮明な場合は、直近のアクティビティから計算された値を優先するようにプロンプトを構成
        wellnessStr = `
- Fitness (CTL): ${wellness.ctl != null ? Math.round(wellness.ctl) : '-'} (独自計算による正確な値)
- Fatigue (ATL): ${wellness.atl != null ? Math.round(wellness.atl) : '-'} (独自計算による正確な値)
- Form (TSB): ${wellness.tsb != null ? Math.round(wellness.tsb) : '-'} (独自計算による正確な値)
- 安静時心拍数: ${wellness.restingHR || '-'} bpm
- HRV: ${wellness.hrv ? Math.round(wellness.hrv) : '-'}
- 睡眠時間: ${wellness.sleepSecs ? Math.floor(wellness.sleepSecs/3600) + 'h ' + Math.floor((wellness.sleepSecs%3600)/60) + 'm' : '-'}
- 疲労感(主観 1-4): ${wellness.fatigue || '-'}
`;
    }

    let workoutStr = '(予定なし)';
    if (workouts && workouts.length > 0) {
        workoutStr = workouts.map(w => `- ${w.title}: ${w.description}`).join('\n');
    }

    let recentStr = '';
    if (recentActivities && recentActivities.length > 0) {
        const hevyActs = recentActivities.filter(a => a.type === 'WeightTraining').slice(0, 3);
        if (hevyActs.length > 0) {
            recentStr = `\n【最近のウェイトトレーニング (Hevy)】\n` + hevyActs.map(a => `- ${new Date(a.start_date_local).toLocaleDateString()}: ${a.name} (${Math.round(a.moving_time/60)}分)`).join('\n') + `\n(※上記筋トレによる疲労や筋肉痛の可能性も考慮してください)`;
        }
    }

    const prompt = `
あなたはプロの自転車競技コーチです。
アスリートの「今朝のコンディション（ウェルネス）」と「今日のトレーニング予定」をもとに、
今日のトレーニングを予定通り実行すべきか、強度を落とすべきか、または休むべきか直近の的確なアドバイスを**日本語で**簡潔（3〜4文程度）に提供してください。

【今朝のコンディション】
${wellnessStr}
${recentStr}

【今日のトレーニング予定】
${workoutStr}

回答は、親しみやすくポジティブなトーンでお願いします。不要な挨拶や前置きは省き、すぐにアドバイスから始めてください。
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) throw new Error('No valid response from AI');
        return aiText;
    } catch (e: any) {
        throw new Error('アドバイスの取得に失敗しました: ' + e.message);
    }
}

/**
 * 特定のトレーニングメニューに対して、最新のコンテキストに基づいた動的なアドバイスを取得する
 */
export async function getDynamicWorkoutAdvice(workoutTitle: string, workoutDesc: string): Promise<string> {
    const apiKey = storage.getItem('gemini_api_key');
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。');
    }

    const savedModel = storage.getItem('gemini_model') || 'gemini-1.5-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${savedModel}:generateContent`;


    try {
        const contextStr = await buildUserContext();
        
        const prompt = `
あなたはプロの自転車競技コーチとして、今日予定されている具体的なトレーニングメニューに対して、アスリートの最新の体調データを踏まえたアドバイスを提供してください。

【ユーザーの最新コンテキスト】
${contextStr}

【今日の予定メニュー】
- タイトル: ${workoutTitle}
- 詳細: ${workoutDesc}

指示:
1. 現在のFitness (CTL) / Fatigue (ATL) / Form (TSB) や最近のトレーニング履歴、ウェルネス（睡眠やHRV）から、今日のコンディションを分析してください。
2. そのコンディションを踏まえ、予定されているメニューを「そのまま実行すべきか」「強度や時間を調整すべきか」「中止すべきか」を判断し、理由とともにアドバイスしてください。
3. ウェイトトレーニングが予定されている場合、最近の筋トレ履歴も考慮したオーバーワーク防止のアドバイスを含めてください。
4. 回答は日本語で、簡潔かつ実践的にマークダウン形式で記述してください（200文字〜300文字程度）。
5. 親しみやすく前向きなトーンで回答してください。
`;

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) throw new Error('AIからの有効な応答が得られませんでした。');
        return aiText;
    } catch (e: any) {
        throw new Error('動的アドバイスの取得に失敗しました: ' + e.message);
    }
}



/**
 * AI Service - handles all interactions with the Gemini API
 */

/**
 * アスリートレベル（Progression Levels）の型定義
 */
export interface ProgressionLevels {
    endurance: number;
    tempo: number;
    sweetSpot: number;
    threshold: number;
    vo2max: number;
    anaerobic: number;
    lastUpdate?: string;
}

/**
 * 分析用：アスリートレベルの初期値
 */
const DEFAULT_LEVELS: ProgressionLevels = {
    endurance: 1.0,
    tempo: 1.0,
    sweetSpot: 1.0,
    threshold: 1.0,
    vo2max: 1.0,
    anaerobic: 1.0
};

/**
 * 直近のアクティビティを分析し、アスリートレベルを更新する
 * 過去90日間のデータを考慮し、より精度の高い初期レベル設定を行う
 */
export async function evaluateProgressionLevels(activities: any[]): Promise<ProgressionLevels> {
    const apiKey = storage.getItem('gemini_api_key');
    if (!apiKey) return JSON.parse(storage.getItem('athlete_levels') || JSON.stringify(DEFAULT_LEVELS));

    const savedModel = storage.getItem('gemini_model') || 'gemini-1.5-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${savedModel}:generateContent`;

    // 過去90日のアクティビティを対象にしてより深く分析する
    const history = activities.filter(a => {
        const d = new Date(a.start_date_local);
        return (new Date().getTime() - d.getTime()) < 90 * 24 * 60 * 60 * 1000;
    });

    const currentLevels = JSON.parse(storage.getItem('athlete_levels') || JSON.stringify(DEFAULT_LEVELS));

    const historySummary = history.slice(0, 45).map(a => {
        const date = a.start_date_local.split('T')[0];
        const tss = a.icu_training_load || a.tss || 0;
        const if_val = (a.icu_intensity || 0) / 100 || '不明';
        const np = a.normalized_watts ? `${Math.round(a.normalized_watts)}W` : '不明';
        const hr = a.average_heartrate ? `HR:${Math.round(a.average_heartrate)}` : '';
        const zones = a.icu_zone_times ? `Zones(Z1-Z7秒): ${JSON.stringify(a.icu_zone_times)}` : '詳細ゾーンデータなし';
        return `- ${date}: ${a.name}, TSS=${tss}, IF=${if_val}, NP=${np}, ${hr}, ${zones}`;
    }).join('\n');

    const prompt = `
あなたは世界的に著名なロードサイクリングのデータアナリスト兼コーチです。
ユーザーから提供された過去90日間のアクティビティデータ（TSS, IF, NP, 心拍数, ゾーン滞在時間等）を詳細にクロス分析し、アスリートの「プログレッションレベル (1.0〜10.0)」を評価・更新してください。

【現在のアスリートレベル（暫定数値）】
${JSON.stringify(currentLevels)}

【過去90日間のアクティビティ履歴（主要な45件）】
${historySummary}

分析のガイドライン:
1. **VO2Max (1.0-10.0)**:
   - 最も重視するのは Z5 (第5要素) での継続的な滞在時間です。
   - IFが 0.95 以上のアクティビティや、名前に「VO2Max」「Interval」「ヒルクライム」が含まれる高強度ワークアウトをチェックしてください。
   - 最近（直近2週間）でこれらがない場合、レベルは維持、あるいは 0.1 単位で漸減させてください。
2. **Threshold (1.0-10.0)**:
   - Z4での滞在時間、および IF 0.85〜0.95 のアクティビティを重視してください。
3. **Endurance (1.0-10.0)**:
   - Z2での長時間の滞在（2時間以上等）がある場合に向上させます。
4. **全体整合性**: 
   - レベルが急激に（例：1日で +2.0 など）上昇することは稀です。通常は +0.1〜0.5 程度の変化が現実的です。
   - データが極端に少ない、または低強度のみの場合は 1.0 に近づけてください。

【最重要】回答は必ず以下のJSON形式のみで行ってください。
JSON構造: {"endurance": FLOAT, "tempo": FLOAT, "sweetSpot": FLOAT, "threshold": FLOAT, "vo2max": FLOAT, "anaerobic": FLOAT}
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.4, response_mime_type: "application/json" }
            })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        const aiJson = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
        
        const newLevels = { ...aiJson, lastUpdate: new Date().toISOString() };
        storage.setItem('athlete_levels', JSON.stringify(newLevels));
        return newLevels;
    } catch (e) {
        console.error('Level evaluation failed:', e);
        return currentLevels;
    }
}

/**
 * 特定のワークアウトを完了した際のレベル向上を予測する
 */
export async function predictLevelUp(workout: { title: string, description: string }): Promise<Partial<ProgressionLevels>> {
    const apiKey = storage.getItem('gemini_api_key');
    if (!apiKey) return {};

    const savedModel = storage.getItem('gemini_model') || 'gemini-1.5-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${savedModel}:generateContent`;

    const prompt = `
あなたはコーチです。今日予定されているワークアウトの内容を分析し、それを完遂した場合に「アスリートレベル」がどれくらい向上するか予測してください。

【予定メニュー】
- タイトル: ${workout.title}
- 内容: ${workout.description}

指示:
1. このワークアウトがいずれのゾーン（Endurance, Tempo, SweetSpot, Threshold, VO2Max, Anaerobic）の強化に繋がるか判断してください。
2. 向上幅を 0.1 〜 0.5 の範囲で予測してください。もし複数のゾーンに跨る場合は、主要な数項目のみ挙げてください。
3. **JSON形式のみで回答してください**。
JSON構造例: {"endurance": 0.2, "tempo": 0.1} (向上する値のみ)
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) {
        return {};
    }
}

/**
 * 過去のデータと未来の予定から、次回のFTPを予測する
 */
export async function predictFutureFtp(): Promise<{ current: number, predicted: number, date: string, confidence: number }> {
    const apiKey = storage.getItem('gemini_api_key');
    const currentFtp = parseInt(storage.getItem('user_ftp') || '242');
    const scheduled = JSON.parse(storage.getItem('scheduled_workouts') || '[]');
    const levels = JSON.parse(storage.getItem('athlete_levels') || JSON.stringify(DEFAULT_LEVELS));
    
    if (!apiKey) return { current: currentFtp, predicted: currentFtp, date: 'APIキー未設定', confidence: 0 };

    const savedModel = storage.getItem('gemini_model') || 'gemini-1.5-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${savedModel}:generateContent`;

    const prompt = `
あなたはスポーツ科学者です。アスリートの現在の数値と今後の予定メニューに基づき、10日後のFTP推測を行ってください。

【現在】
- FTP: ${currentFtp} W
- アスリートレベル: ${JSON.stringify(levels)}

【今後の予定（一部）】
${scheduled.slice(0, 7).map((s: any) => `- ${s.date}: ${s.title} (${s.description})`).join('\n')}

指示:
1. 予定されているワークアウトの頻度、強度から、FTPがどれくらい向上するか予測してください。
2. もし予定が少なすぎる場合は維持、または微減の予測を立ててください。
3. **JSON形式のみで回答してください**。
JSON構造例: {"predicted": 248, "days": 10, "confidence": 0.85}
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        const aiJson = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
        
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (aiJson.days || 10));
        
        const result = {
            current: currentFtp,
            predicted: aiJson.predicted,
            date: targetDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
            confidence: aiJson.confidence
        };
        storage.setItem('ftp_prediction', JSON.stringify(result));
        return result;
    } catch (e) {
        return { current: currentFtp, predicted: currentFtp, date: 'データ不足', confidence: 0 };
    }
}
/**
 * 完了したアクティビティの内容を分析し、レベルへの影響やトレーニングの質を評価する
 */
export async function analyzeActivityProgression(activity: any): Promise<{ advice: string, levels: Partial<ProgressionLevels> }> {
    const apiKey = storage.getItem('gemini_api_key');
    if (!apiKey) return { advice: 'APIキーが設定されていません。 設定画面で設定してください。', levels: {} };

    const savedModel = storage.getItem('gemini_model') || 'gemini-1.5-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${savedModel}:generateContent`;

    const prompt = `
あなたはプロの自転車競技コーチです。完了したワークアウトの詳細データを分析し、トレーニングの質とアスリートレベルへの影響を評価してください。

【アクティビティデータ】
- 名前: ${activity.name}
- タイプ: ${activity.type}
- 時間: ${Math.round(activity.moving_time/60)}分
- TSS: ${activity.icu_training_load || activity.tss || 0}
- IF: ${(activity.icu_intensity || 0)/100}
- 平均心拍: ${activity.average_heartrate || '不明'}
- ゾーン滞在時間(秒): ${JSON.stringify(activity.icu_zone_times || [])}

指示:
1. このワークアウトがどのゾーン（Endurance, Tempo, SweetSpot, Threshold, VO2Max, Anaerobic）の向上に最も寄与したか判断してください。
2. ワークアウトの質（強度設定が適切だったか、オーバーワークの兆候はないか等）について、150文字程度で具体的なアドバイスを日本語で提供してください。
3. 向上したレベルを 0.1〜0.5 の範囲で予測してください。
4. **JSON形式のみで回答してください**。

JSON構造:
{
  "advice": "アドバイス内容（日本語）",
  "levels": {"endurance": 0.3, "threshold": 0.1}
}
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
        return result;
    } catch (e) {
        console.error('Activity analysis failed:', e);
        return { advice: '分析中にエラーが発生しました。', levels: {} };
    }
}
