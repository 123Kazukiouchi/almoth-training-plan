// Hevy API integration service
// API Endpoint: https://api.hevyapp.com/v1/workouts

export interface HevySet {
    index: number;
    type: string; // 'warmup', 'normal', etc.
    weight_kg: number;
    reps: number;
    distance_meters: number;
    duration_seconds: number;
    rpe: number | null;
}

export interface HevyExercise {
    index: number;
    title: string;
    notes: string;
    sets: HevySet[];
}

export interface HevyWorkout {
    id: string;
    title: string;
    description: string;
    start_time: string; // ISO DateTime
    end_time: string;   // ISO DateTime
    exercises: HevyExercise[];
}

export interface HevyResponse {
    page: number;
    page_count: number;
    workouts: HevyWorkout[];
}

/**
 * Hevyから最新のワークアウトを取得する
 * 今回は最大で最新ページ1つを取得し設定されている場合のみ返す簡易実装とする
 */
export async function fetchHevyWorkouts(): Promise<HevyWorkout[]> {
    const apiKey = storage.getItem('hevy_api_key');
    if (!apiKey) {
        return [];
    }

    try {
        const response = await fetch('https://api.hevyapp.com/v1/workouts?page=1&pageSize=10', {
            method: 'GET',
            headers: {
                'api-key': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`Hevy API Error: ${response.status}`);
            return [];
        }

        const data: HevyResponse = await response.json();
        return data.workouts || [];
    } catch (error) {
        console.error('Error fetching Hevy workouts:', error);
        return [];
    }
}
