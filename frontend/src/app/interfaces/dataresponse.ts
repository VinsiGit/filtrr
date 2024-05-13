export interface LabelData {
    data: DayData[];
    end_date: string;
    labels: string[];
    rating: string;
    source: string;
    start_date: string;
    total: number;
}

export interface DayData {
    average_processing_time: number;
    date: string;
    labels_count: LabelCount[];
    total: number;
}

export interface LabelCount {
    count: number;
    average_confidence: number;
    evaluation: number;
    label: string;
    rating_count: number;
}
