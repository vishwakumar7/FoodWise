from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format", example="2025-10-15")
    menu_type: str = Field(..., description="Menu category (Meals, Variety Rice, Biryani, Dosa, Idli)", example="Biryani")
    expected_attendance: int = Field(..., ge=1, le=2000, description="Expected student or customer attendance", example=350)
    temperature: float = Field(..., ge=-10.0, le=60.0, description="Ambient temperature in °C", example=28.5)
    prev_day_sales: float = Field(..., ge=0, le=2000, description="Sales of this item from previous operational day", example=180.0)
    is_holiday: int = Field(0, ge=0, le=1, description="1 if holiday / vacation / weekend, else 0", example=0)
    planned_meals: Optional[int] = Field(None, ge=0, description="Number of meals planned for preparation", example=200)
    cost_per_meal: Optional[float] = Field(50.0, gt=0, description="Estimated preparation cost per meal", example=50.0)


class PredictResponse(BaseModel):
    date: str
    day_of_week: str
    menu_type: str
    predicted_meals: float
    rounded_prediction: int
    planned_meals: int
    surplus: int
    shortage: int
    prep_cost: float
    surplus_cost: float
    cost_per_meal: float
    uncertainty_lower: float
    uncertainty_upper: float
    uncertainty_std: float
    confidence_explanation: str
    recommendation: str
    is_synthetic_model: bool = True


class ScenarioItem(BaseModel):
    scenario_name: str
    strategy_type: str
    planned_meals: int
    predicted_demand: float
    surplus: int
    shortage: int
    prep_cost: float
    surplus_cost: float
    risk_assessment: str


class ScenariosRequest(BaseModel):
    predict_request: PredictRequest
    conservative_planned: Optional[int] = None
    predicted_planned: Optional[int] = None
    buffer_planned: Optional[int] = None
    custom_planned: Optional[int] = None
    conservative_ratio: Optional[float] = 0.85
    buffer_ratio: Optional[float] = 1.15


class ScenariosResponse(BaseModel):
    menu_type: str
    predicted_demand: float
    cost_per_meal: float
    scenarios: List[ScenarioItem]
    recommendation: str
    cost_explanation: str


class WasteRecordCreate(BaseModel):
    date: str = Field(..., description="Date of record YYYY-MM-DD")
    menu_type: str = Field(..., description="Menu item category")
    meals_prepared: int = Field(..., ge=0, description="Total meals prepared")
    meals_sold: int = Field(..., ge=0, description="Total meals sold")
    discarded_meals: int = Field(..., ge=0, description="Actual meals discarded/wasted")
    cost_per_meal: float = Field(50.0, gt=0, description="Unit cost per meal")
    notes: Optional[str] = Field("", description="Operational remarks or reasons")


class WasteRecordResponse(BaseModel):
    id: str
    date: str
    menu_type: str
    meals_prepared: int
    meals_sold: int
    leftover_meals: int
    discarded_meals: int
    waste_percentage: float
    wasted_cost: float
    cost_per_meal: float
    notes: str


class ModelMetricsResponse(BaseModel):
    model_name: str
    algorithm: str
    n_estimators: int
    train_records: int
    test_records: int
    mae: float
    rmse: float
    r2: float
    baseline_mae: float
    baseline_rmse: float
    baseline_r2: float
    improvement_percent: float
    feature_importances: Dict[str, float]
    sample_test_predictions: List[Dict]
    is_synthetic: bool
    data_notice: str
    last_trained: str


class HistoricalRecord(BaseModel):
    date: str
    day_of_week: str
    menu_type: str
    expected_attendance: int
    temperature: float
    prev_day_sales: float
    is_holiday: int
    actual_meals_sold: int


class DashboardSummary(BaseModel):
    total_records: int
    unique_dates: int
    menu_categories: List[str]
    date_range_start: str
    date_range_end: str
    avg_daily_demand: float
    top_menu_by_demand: str
    avg_waste_percentage: float
    total_discarded_recorded: int
    dataset_disclaimer: str
    model_status: str
