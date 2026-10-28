export type ComparisonAssessment = {
  uuid: string;
  evaluation_date: string;
  status: 'completed';
  evaluator: {
    id: number | null;
    name: string | null;
  };
  protocol: string | null;
};

export type ComparisonMetric = {
  key:
    | 'weight_kg'
    | 'height_m'
    | 'bmi'
    | 'body_fat_percentage'
    | 'waist_cm'
    | 'hip_cm'
    | 'waist_to_hip_ratio';
  label: string;
  unit: string | null;
  base: number | null;
  target: number | null;
  delta: number | null;
};

export type AssessmentComparisonResponse = {
  data: {
    student: { uuid: string; name: string };
    base: ComparisonAssessment;
    target: ComparisonAssessment;
    metrics: ComparisonMetric[];
    note: string;
  };
};
