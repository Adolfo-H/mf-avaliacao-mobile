export type ClinicalPreviewStatus =
  | 'protocol_not_selected'
  | 'pending_professional_validation'
  | 'unsupported_sex_for_equation'
  | 'missing_age'
  | 'outside_studied_age_range'
  | 'missing_measurements'
  | 'invalid_measurements'
  | 'invalid_formula_result'
  | 'preview_available';

export type ClinicalSkinfoldPreview = {
  protocol: string | null;
  protocol_label: string;
  status: ClinicalPreviewStatus;
  formula_version: string;
  age_at_evaluation: number | null;
  sex_for_equation: string | null;
  required_skinfolds: string[];
  missing_skinfolds: string[];
  body_density_preview: number | null;
  body_fat_percentage_preview: number | null;
  classification: null;
  professionally_approved: false;
  persisted: false;
  warning: string;
  reference: string;
};

export type AssessmentClinicalPreviewResponse = {
  data: {
    assessment_uuid: string;
    evaluation_date: string | null;
    preview: ClinicalSkinfoldPreview;
  };
};
