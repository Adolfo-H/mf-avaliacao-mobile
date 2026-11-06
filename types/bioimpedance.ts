/** Resultados transcritos do equipamento. Não são cálculos nem laudos do aplicativo. */
export type BioimpedanceRecord = {
  manufacturer?: string | null;
  model?: string | null;
  software_version?: string | null;
  measured_on?: string | null;
  reported_weight_kg?: number | null;
  body_fat_percentage?: number | null;
  fat_mass_kg?: number | null;
  fat_free_mass_kg?: number | null;
  skeletal_muscle_mass_kg?: number | null;
  total_body_water_percentage?: number | null;
  resistance_ohm?: number | null;
  reactance_ohm?: number | null;
  conditions?: string | null;
  notes?: string | null;
};

export type BioimpedanceCompositionResponse = {
  data: {
    body_composition: {
      protocol?: string | null;
      bioimpedance?: BioimpedanceRecord | null;
    };
    section: { status_label?: string | null };
  };
};

export type BioimpedanceMetric = {
  key: string;
  label: string;
  unit: string;
  value: number | null;
};

export type BioimpedancePreview = {
  assessment_uuid: string;
  protocol_selected: boolean;
  status: 'protocol_not_selected' | 'no_measurements' | 'device_values_recorded';
  homologated: false;
  calculation_performed: false;
  source: 'reported_by_device';
  device: {
    manufacturer: string | null;
    model: string | null;
    software_version: string | null;
    measured_on: string | null;
  };
  measurements: BioimpedanceMetric[];
  conditions: string | null;
  notes: string | null;
  notice: string;
};

export type BioimpedancePreviewResponse = { data: BioimpedancePreview };
