export interface PredictRequest {
  date: string;
  menu_type: string;
  expected_attendance: number;
  temperature: number;
  prev_day_sales: number;
  is_holiday: number;
  planned_meals?: number;
  cost_per_meal?: number;
}

export interface PredictResponse {
  date: string;
  day_of_week: string;
  menu_type: string;
  predicted_meals: number;
  rounded_prediction: number;
  planned_meals: number;
  surplus: number;
  shortage: number;
  prep_cost: number;
  surplus_cost: number;
  cost_per_meal: number;
  uncertainty_lower: number;
  uncertainty_upper: number;
  uncertainty_std: number;
  confidence_explanation: string;
  recommendation: string;
  is_synthetic_model: boolean;
}

export interface ScenarioItem {
  scenario_name: string;
  strategy_type: 'conservative' | 'predicted' | 'buffer' | 'custom' | string;
  planned_meals: number;
  predicted_demand: number;
  surplus: number;
  shortage: number;
  prep_cost: number;
  surplus_cost: number;
  risk_assessment: string;
}

export interface ScenariosRequest {
  predict_request: PredictRequest;
  conservative_planned?: number;
  predicted_planned?: number;
  buffer_planned?: number;
  custom_planned?: number;
  conservative_ratio?: number;
  buffer_ratio?: number;
}

export interface ScenariosResponse {
  menu_type: string;
  predicted_demand: number;
  cost_per_meal: number;
  scenarios: ScenarioItem[];
  recommendation: string;
  cost_explanation: string;
}

export interface WasteRecordCreate {
  date: string;
  menu_type: string;
  meals_prepared: number;
  meals_sold: number;
  discarded_meals: number;
  cost_per_meal: number;
  notes?: string;
}

export interface WasteRecord {
  id: string;
  date: string;
  menu_type: string;
  meals_prepared: number;
  meals_sold: number;
  leftover_meals: number;
  discarded_meals: number;
  waste_percentage: number;
  wasted_cost: number;
  cost_per_meal: number;
  notes: string;
}

export interface SamplePrediction {
  date: string;
  menu_type: string;
  actual: number;
  predicted: number;
  error: number;
}

export interface ModelMetrics {
  model_name: string;
  algorithm: string;
  n_estimators: number;
  train_records: number;
  test_records: number;
  mae: number;
  rmse: number;
  r2: number;
  baseline_mae: number;
  baseline_rmse: number;
  baseline_r2: number;
  improvement_percent: number;
  feature_importances: Record<string, number>;
  sample_test_predictions: SamplePrediction[];
  is_synthetic: boolean;
  data_notice: string;
  last_trained: string;
}

export interface DashboardSummary {
  total_records: number;
  unique_dates: number;
  menu_categories: string[];
  date_range_start: string;
  date_range_end: string;
  avg_daily_demand: float;
  top_menu_by_demand: string;
  avg_waste_percentage: number;
  total_discarded_recorded: number;
  dataset_disclaimer: string;
  model_status: string;
}

export interface HistoricalRecord {
  date: string;
  day_of_week: string;
  menu_type: string;
  expected_attendance: number;
  temperature: number;
  prev_day_sales: number;
  is_holiday: number;
  actual_meals_sold: number;
}

export interface ChartsData {
  analytics: {
    daily_trend: Array<any>;
    weekday_demand: Array<{ day: string; full_day: string; avg_meals: number; total_meals: number }>;
    menu_breakdown: Array<{ menu_type: string; total_meals: number; avg_meals: number; share_percent: number }>;
    attendance_vs_sales: Array<{ attendance: number; meals_sold: number; menu_type: string; is_holiday: number }>;
  };
  waste: {
    total_records: number;
    avg_waste_pct: number;
    total_discarded: number;
    total_wasted_cost: number;
    menu_waste_breakdown: Array<{ menu_type: string; total_prepared: number; total_discarded: number; waste_percentage: number; wasted_cost: number }>;
    waste_trend: Array<any>;
  };
}

export type float = number;
