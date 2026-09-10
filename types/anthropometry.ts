export type BilateralMeasurement = {
  right?: number | null;
  left?: number | null;
};

export type AnthropometryCircumferences = {
  forearm?: BilateralMeasurement;
  relaxed_arm?: BilateralMeasurement;
  flexed_arm?: BilateralMeasurement;
  proximal_thigh?: BilateralMeasurement;
  medial_thigh?: BilateralMeasurement;
  distal_thigh?: BilateralMeasurement;
  calf?: BilateralMeasurement;

  abdomen?: number | null;
  waist?: number | null;
  shoulder?: number | null;
  hip?: number | null;
  chest?: number | null;
  neck?: number | null;
};

export type AnthropometryBoneDiameters = {
  wrist?: number | null;
  humerus?: number | null;
  femur?: number | null;
};

export type AnthropometryPayload = {
  circumferences?: AnthropometryCircumferences;
  bone_diameters?: AnthropometryBoneDiameters;
};

export type WaistToHipRatioResult = {
  value: number;
  formula: string;
  version: string;
  calculated_at: string | null;
};

export type AnthropometryResults = {
  waist_to_hip_ratio:
    | WaistToHipRatioResult
    | null;

  waist_to_hip_ratio_classification:
    | string
    | null;
};

export type PreviousAnthropometry = {
  assessment_uuid: string;
  evaluation_date: string;

  circumferences:
    AnthropometryCircumferences;

  bone_diameters:
    AnthropometryBoneDiameters;

  results: AnthropometryResults;
};

export type AnthropometryConfiguration = {
  waist_to_hip_ratio_calculation_configured:
    boolean;

  waist_to_hip_ratio_classification_configured:
    boolean;

  circumference_unit: string;

  bone_diameter_unit: string;
};

export type AnthropometrySection = {
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

export type AssessmentAnthropometry = {
  assessment_uuid: string;

  anthropometry: {
    circumferences:
      AnthropometryCircumferences;

    bone_diameters:
      AnthropometryBoneDiameters;
  };

  results: AnthropometryResults;

  previous:
    | PreviousAnthropometry
    | null;

  configuration:
    AnthropometryConfiguration;

  section: AnthropometrySection;
};

export type AssessmentAnthropometryResponse = {
  data: AssessmentAnthropometry;
};

export type UpdateAnthropometryPayload =
  AnthropometryPayload;
