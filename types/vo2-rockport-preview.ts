export type RockportPreviewStatus =
  | 'protocol_not_selected'
  | 'pending_professional_validation'
  | 'missing_age'
  | 'outside_original_age_range'
  | 'sex_not_supported_by_equation'
  | 'missing_distance'
  | 'invalid_mile_distance'
  | 'missing_time'
  | 'invalid_time'
  | 'missing_weight'
  | 'invalid_weight'
  | 'missing_heart_rate'
  | 'invalid_heart_rate'
  | 'invalid_formula_result'
  | 'preview_available';

export type RockportPreview = {
  protocol: string | null;
  status: RockportPreviewStatus;
  formula_version: string;
  formula: string;
  reference: string;
  reference_url: string;
  unit: 'ml/kg/min';
  estimated_vo2_ml_kg_min: number | null;
  distance_m_used: number | null;
  time_seconds_used: number | null;
  heart_rate_bpm_used: number | null;
  weight_kg_used: number | null;
  age_years_used: number | null;
  sex_used: 'male' | 'female' | null;
  professionally_approved: false;
  persisted: false;
  classification: null;
  warning: string;
};

export type RockportPreviewData = {
  assessment_uuid: string;
  evaluation_date: string | null;
  preview: RockportPreview;
};

export type RockportPreviewResponse = { data: RockportPreviewData };
