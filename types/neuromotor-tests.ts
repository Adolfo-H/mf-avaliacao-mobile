export type FlexibilityProtocol =
  | 'wells_dillon'
  | 'flexitest';

export type FlexibilityTest = {
  protocol?: FlexibilityProtocol | null;
  result?: number | null;
  unit?: string | null;
  observation?: string | null;
  test_date?: string | null;
};

export type ResistanceEntry = {
  repetitions?: number | null;
  time_seconds?: number | null;
  protocol?: string | null;
  result?: number | null;
  unit?: string | null;
  observation?: string | null;
  test_date?: string | null;
};

export type NeuromotorPayload = {
  flexibility?: FlexibilityTest;
  resistance?: {
    abdominal_flexion?: ResistanceEntry;
    push_ups?: ResistanceEntry;
  };
};

export type NeuromotorResults = {
  flexibility: {
    classification: string | null;
    reference_table: string | null;
  };
  resistance: {
    abdominal_flexion: {
      classification: string | null;
      reference_range: string | null;
    };
    push_ups: {
      classification: string | null;
      reference_range: string | null;
    };
  };
  calculation_status: string;
};

export type PreviousNeuromotor = {
  assessment_uuid: string;
  evaluation_date: string;
  neuromotor_tests: NeuromotorPayload;
  results: NeuromotorResults;
};

export type NeuromotorConfiguration = {
  flexibility_protocols: {
    key: FlexibilityProtocol;
    label: string;
  }[];
  resistance_tests: {
    key:
      | 'abdominal_flexion'
      | 'push_ups';
    label: string;
  }[];
  classification_configured: boolean;
  reference_tables_configured: boolean;
  calculation_status: string;
};

export type NeuromotorSection = {
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

export type AssessmentNeuromotor = {
  assessment_uuid: string;
  neuromotor_tests: NeuromotorPayload;
  results: NeuromotorResults;
  previous: PreviousNeuromotor | null;
  configuration: NeuromotorConfiguration;
  section: NeuromotorSection;
};

export type AssessmentNeuromotorResponse = {
  data: AssessmentNeuromotor;
};

export type UpdateNeuromotorPayload =
  NeuromotorPayload;
