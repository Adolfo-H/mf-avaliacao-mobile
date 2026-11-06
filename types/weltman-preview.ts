export type WeltmanMeasurements = {
  abdomen_upper_cm: number | null;
  abdomen_umbilicus_cm: number | null;
  applicability_confirmed: boolean;
};

export type WeltmanPreviewInputs = {
  sex: 'male' | 'female' | 'other' | 'not_informed' | null;
  age_at_evaluation: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  abdomen_upper_cm: number | null;
  abdomen_umbilicus_cm: number | null;
  mean_abdomen_cm: number | null;
  applicability_confirmed: boolean;
};

export type WeltmanPreview = {
  assessment_uuid: string;
  protocol_selected: boolean;
  status: string;
  percentage: number | null;
  unit: '%';
  calculated: boolean;
  homologated: false;
  clinical_result_saved: false;
  calculator_version: string;
  formula: string | null;
  reference: string | null;
  reference_url: string | null;
  inputs: WeltmanPreviewInputs;
  notice: string;
  reason: string | null;
};

export type WeltmanPreviewResponse = {
  data: WeltmanPreview;
};
