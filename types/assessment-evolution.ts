export type EvolutionPeriodMonths = 3 | 6 | 12;
export type EvolutionMetricGroup = 'body' | 'circumference' | 'ratio';

export type EvolutionPoint = {
  assessment_uuid: string;
  evaluation_date: string | null;
  value: number | null;
};

export type EvolutionMetric = {
  key: string;
  label: string;
  unit: string | null;
  digits: number;
  group: EvolutionMetricGroup;
  valid_points: number;
  points: EvolutionPoint[];
};

export type StudentAssessmentEvolutionData = {
  student: { uuid: string; name: string };
  period_months: EvolutionPeriodMonths;
  period_start: string;
  period_end: string;
  assessment_count: number;
  has_more: boolean;
  metrics: EvolutionMetric[];
  note: string;
};

export type StudentAssessmentEvolutionResponse = {
  data: StudentAssessmentEvolutionData;
};
