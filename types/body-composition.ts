export type BodyCompositionProtocolKey =
  | 'pollock_7'
  | 'pollock_3'
  | 'guedes_3'
  | 'bioimpedance'
  | 'weltman';

export type BodyCompositionSkinfolds = {
  subscapular?: number | null;
  chest?: number | null;
  suprailiac?: number | null;
  thigh?: number | null;
  triceps?: number | null;
  midaxillary?: number | null;
  abdominal?: number | null;
};

export type BodyCompositionPayload = {
  protocol?: BodyCompositionProtocolKey | null;

  weight_kg?: number | null;

  height_m?: number | null;

  target_body_fat_percentage?:
    | number
    | null;

  skinfolds?: BodyCompositionSkinfolds;
};

export type BodyCompositionBmiResult = {
  value: number;

  formula: string;

  version: string;

  calculated_at: string | null;
};

export type BodyCompositionResults = {
  bmi: BodyCompositionBmiResult | null;

  bmi_classification: string | null;

  body_fat_percentage: number | null;

  fat_mass_kg: number | null;

  lean_mass_kg: number | null;
};

export type PreviousBodyComposition = {
  assessment_uuid: string;

  evaluation_date: string;

  weight_kg: number | null;

  height_m: number | null;

  target_body_fat_percentage:
    | number
    | null;

  skinfolds: BodyCompositionSkinfolds;
};

export type BodyCompositionProtocolOption = {
  key: BodyCompositionProtocolKey;

  label: string;

  fields_configured: boolean;

  calculation_configured: boolean;
};

export type BodyCompositionConfiguration = {
  bmi_calculation_configured: boolean;

  bmi_classification_configured: boolean;

  body_fat_calculation_configured: boolean;
};

export type BodyCompositionSection = {
  status:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'pending'
    | null;

  status_label: string | null;

  started_at: string | null;

  completed_at: string | null;
};

export type AssessmentBodyComposition = {
  assessment_uuid: string;

  body_composition: BodyCompositionPayload;

  results: BodyCompositionResults;

  previous: PreviousBodyComposition | null;

  protocols: BodyCompositionProtocolOption[];

  configuration: BodyCompositionConfiguration;

  section: BodyCompositionSection;
};

export type AssessmentBodyCompositionResponse = {
  data: AssessmentBodyComposition;
};

export type UpdateBodyCompositionPayload =
  BodyCompositionPayload;