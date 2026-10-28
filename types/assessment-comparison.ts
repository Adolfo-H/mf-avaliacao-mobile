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
  key: string;
  label: string;
  unit: string | null;
  base: number | null;
  target: number | null;
  delta: number | null;
  comparison_note?: string | null;
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
