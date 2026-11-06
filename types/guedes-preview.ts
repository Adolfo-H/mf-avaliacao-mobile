export type GuedesPreviewStatus =
  | 'protocol_not_selected'
  | 'unsupported_sex_for_equation'
  | 'missing_age'
  | 'outside_studied_age_range'
  | 'missing_measurements'
  | 'invalid_measurements'
  | 'invalid_formula_result'
  | 'preview_available';

export type GuedesPreview = {
  status: GuedesPreviewStatus;
  message: string;
  protocol: string | null;
  protocol_label: string;
  formula_version: string;
  professionally_approved: false;
  persisted: false;
  sex: string | null;
  age_at_evaluation: number | null;
  studied_age_range: { min: number; max: number } | null;
  required_skinfolds: string[];
  missing_skinfolds: string[];
  sum_skinfolds_mm: number | null;
  body_density_g_ml: number | null;
  body_fat_percentage_preview: number | null;
  formula: string | null;
  conversion: string;
  reference: string;
};

export type GuedesPreviewResponse = {
  data: {
    assessment_uuid: string;
    evaluation_date: string | null;
    preview: GuedesPreview;
  };
};
