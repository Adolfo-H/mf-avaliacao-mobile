export type Run2400PreviewStatus =
  | 'protocol_not_selected'
  | 'other_protocol'
  | 'missing_age'
  | 'outside_review_scope'
  | 'missing_distance'
  | 'invalid_distance'
  | 'missing_time'
  | 'invalid_time'
  | 'invalid_formula_result'
  | 'preview_available';

export type Run2400Preview = {
  protocol: string | null;
  status: Run2400PreviewStatus;
  formula_version: string;
  formula: string;
  reference: string;
  unit: string;
  estimated_vo2_ml_kg_min: number | null;
  distance_m_used: number | null;
  time_seconds_used: number | null;
  professionally_approved: false;
  persisted: false;
  classification: null;
  warning: string;
};

export type Run2400PreviewData = {
  assessment_uuid: string;
  evaluation_date: string | null;
  preview: Run2400Preview;
};
