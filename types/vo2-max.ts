export type Vo2ActivityLevel = 'active' | 'sedentary';

export type Vo2ProtocolKey =
  | 'cooper_12_min'
  | 'run_2400m'
  | 'walk_1_mile';

export type Vo2TestData = {
  distance_m?: number | null;
  time_seconds?: number | null;
  heart_rate_bpm?: number | null;
  weight_kg?: number | null;
  age?: number | null;
  sex?: string | null;
  conditions?: string | null;
  observations?: string | null;
  test_date?: string | null;
};

export type Vo2Results = {
  estimated_max_heart_rate: number | null;
  vo2_max_ml_kg_min: number | null;
  classification: string | null;
  reference_range: string | null;
  calculation_status: string;
};

export type AssessmentVo2Max = {
  assessment_uuid: string;
  evaluation_date: string;

  student: {
    age_at_evaluation: number | null;
    sex: string | null;
  };

  vo2_max: {
    activity_level: Vo2ActivityLevel | null;
    protocol: Vo2ProtocolKey | null;
    test: Vo2TestData;
  };

  results: Vo2Results;

  previous: {
    assessment_uuid: string;
    evaluation_date: string;
    activity_level: Vo2ActivityLevel | null;
    protocol: Vo2ProtocolKey | null;
    test: Vo2TestData;
    results: Vo2Results;
  } | null;

  protocols: Array<{
    key: Vo2ProtocolKey;
    label: string;
  }>;

  configuration: {
    max_heart_rate_formula_configured: boolean;
    vo2_calculation_configured: boolean;
    classification_configured: boolean;
    calculation_status: string;
  };

  section: {
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
};

export type AssessmentVo2MaxResponse = {
  data: AssessmentVo2Max;
};

export type UpdateVo2MaxPayload = {
  activity_level?: Vo2ActivityLevel | null;
  protocol?: Vo2ProtocolKey | null;
  test?: Vo2TestData;
};
