export type CooperPreviewStatus =
  | 'protocol_not_selected'
  | 'pending_professional_validation'
  | 'missing_age'
  | 'outside_review_scope'
  | 'missing_distance'
  | 'invalid_distance'
  | 'invalid_duration'
  | 'invalid_formula_result'
  | 'preview_available';

export type CooperPreview = {
  protocol: string | null;
  status: CooperPreviewStatus;
  formula_version: string;
  formula: string;
  reference: string;
  unit: 'ml/kg/min';
  estimated_vo2_ml_kg_min: number | null;
  distance_m_used: number | null;
  professionally_approved: false;
  persisted: false;
  classification: null;
  warning: string;
};

export type CooperPreviewData = {
  assessment_uuid: string;
  evaluation_date: string | null;
  preview: CooperPreview;
};

export type CooperPreviewResponse = { data: CooperPreviewData };
