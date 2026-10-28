import type { AssessmentStatus } from '@/types/assessment';

export type StudentAssessmentHistoryEntry = {
  uuid: string;
  evaluation_date: string | null;
  status: AssessmentStatus;
  status_label: string | null;
  completed_at: string | null;
  age_at_evaluation: number | null;
  evaluator: {
    id: number | null;
    name: string | null;
  };
  weight_kg: number | null;
  height_m: number | null;
  bmi: number | null;
  body_fat_percentage: number | null;
  protocol: string | null;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
};

export type StudentAssessmentHistoryResponse = {
  data: StudentAssessmentHistoryEntry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type StudentAssessmentHistoryOptions = {
  page?: number;
  per_page?: number;
  status?: AssessmentStatus;
};
