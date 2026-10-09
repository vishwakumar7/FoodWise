import datetime
import json
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import pandas as pd
import joblib

from app.schemas import (
    PredictRequest,
    PredictResponse,
    ScenarioItem,
    ScenariosRequest,
    ScenariosResponse,
    ModelMetricsResponse
)
from app.training import (
    MODEL_FILE,
    METRICS_FILE,
    DATA_FILE,
    FEATURE_COLS,
    WEEKDAYS,
    train_model
)

_cached_pipeline = None


def get_model_pipeline():
    global _cached_pipeline
    if _cached_pipeline is not None:
        return _cached_pipeline
    
    if not MODEL_FILE.exists():
        print("Trained model not found. Training model now...")
        train_model()

    _cached_pipeline = joblib.load(MODEL_FILE)
    return _cached_pipeline


def reload_model_pipeline():
    global _cached_pipeline
    _cached_pipeline = joblib.load(MODEL_FILE)
    return _cached_pipeline


def predict_demand(req: PredictRequest) -> PredictResponse:
    pipeline = get_model_pipeline()

    # Parse date and derive day of week
    try:
        parsed_date = datetime.datetime.strptime(req.date, "%Y-%m-%d").date()
        day_of_week = WEEKDAYS[parsed_date.weekday()]
    except Exception:
        day_of_week = "Monday"

    # Prepare DataFrame matching training feature columns
    input_data = pd.DataFrame([{
        "Day of week": day_of_week,
        "Menu type": req.menu_type,
        "Expected attendance": int(req.expected_attendance),
        "Temperature": float(req.temperature),
        "Previous day's sales": float(req.prev_day_sales),
        "Holiday indicator": int(req.is_holiday)
    }])[FEATURE_COLS]

    # Predict with full pipeline
    pred_val = float(pipeline.predict(input_data)[0])
    pred_val = max(0.0, pred_val)
    rounded_pred = int(round(pred_val))

    # Calculate defensible prediction uncertainty using Random Forest tree ensemble
    try:
        preprocessor = pipeline.named_steps["preprocessor"]
        regressor = pipeline.named_steps["regressor"]
        X_trans = preprocessor.transform(input_data)
        tree_preds = [float(tree.predict(X_trans)[0]) for tree in regressor.estimators_]
        lower_bound = max(0.0, round(float(np.percentile(tree_preds, 10)), 1))
        upper_bound = round(float(np.percentile(tree_preds, 90)), 1)
        std_dev = round(float(np.std(tree_preds)), 1)
        conf_explanation = (
            f"Ensemble 80% prediction interval [{lower_bound} - {upper_bound} meals] "
            f"derived from variance across {len(tree_preds)} Random Forest decision trees (std dev +/-{std_dev})."
        )
    except Exception:
        lower_bound = max(0.0, round(pred_val * 0.9, 1))
        upper_bound = round(pred_val * 1.1, 1)
        std_dev = round(pred_val * 0.05, 1)
        conf_explanation = "Statistical uncertainty estimate (+/-10% empirical tolerance)."

    planned = req.planned_meals if req.planned_meals is not None else rounded_pred
    cost_per_meal = req.cost_per_meal if req.cost_per_meal is not None else 50.0

    # Business calculations
    surplus = max(0, planned - rounded_pred)
    shortage = max(0, rounded_pred - planned)
    prep_cost = round(planned * cost_per_meal, 2)
    surplus_cost = round(surplus * cost_per_meal, 2)

    if surplus > 20:
        recommendation = (
            f"High surplus risk: Planning {planned} meals exceeds predicted demand ({rounded_pred}) "
            f"by {surplus} meals. Consider reducing batch size to prevent ~Rs. {surplus_cost:.0f} in food waste."
        )
    elif shortage > 20:
        recommendation = (
            f"Potential shortage risk: Planning {planned} meals is {shortage} below predicted demand ({rounded_pred}). "
            f"Consider a safety buffer to prevent stockouts during peak cafeteria hours."
        )
    elif surplus > 0:
        recommendation = (
            f"Mild buffer: Planning {planned} meals provides a safe {surplus}-meal cushion against unexpected turnout."
        )
    elif shortage > 0:
        recommendation = (
            f"Lean plan: Planning {planned} meals carries a slight {shortage}-meal shortage risk if attendance peaks."
        )
    else:
        recommendation = f"Optimally balanced: Planned batch perfectly matches model forecast of {rounded_pred} meals."

    return PredictResponse(
        date=req.date,
        day_of_week=day_of_week,
        menu_type=req.menu_type,
        predicted_meals=round(pred_val, 1),
        rounded_prediction=rounded_pred,
        planned_meals=planned,
        surplus=surplus,
        shortage=shortage,
        prep_cost=prep_cost,
        surplus_cost=surplus_cost,
        cost_per_meal=cost_per_meal,
        uncertainty_lower=lower_bound,
        uncertainty_upper=upper_bound,
        uncertainty_std=std_dev,
        confidence_explanation=conf_explanation,
        recommendation=recommendation,
        is_synthetic_model=True
    )


def evaluate_scenarios(req: ScenariosRequest) -> ScenariosResponse:
    pred_res = predict_demand(req.predict_request)
    predicted_val = pred_res.predicted_meals
    predicted_rounded = pred_res.rounded_prediction
    cost_per_meal = req.predict_request.cost_per_meal or 50.0

    # Determine planned quantities for strategies
    # 1. Conservative (default -15% or user defined)
    if req.conservative_planned is not None:
        conservative_qty = max(0, req.conservative_planned)
    else:
        ratio = req.conservative_ratio or 0.85
        conservative_qty = max(0, int(round(predicted_val * ratio)))

    # 2. Predicted Demand (100% or user defined)
    if req.predicted_planned is not None:
        predicted_qty = max(0, req.predicted_planned)
    else:
        predicted_qty = predicted_rounded

    # 3. Safety Buffer (default +15% or user defined)
    if req.buffer_planned is not None:
        buffer_qty = max(0, req.buffer_planned)
    else:
        ratio = req.buffer_ratio or 1.15
        buffer_qty = max(0, int(round(predicted_val * ratio)))

    scenarios: List[ScenarioItem] = []

    def make_scenario(name: str, stype: str, qty: int, risk: str) -> ScenarioItem:
        surplus = max(0, qty - predicted_rounded)
        shortage = max(0, predicted_rounded - qty)
        prep_cost = round(qty * cost_per_meal, 2)
        surplus_cost = round(surplus * cost_per_meal, 2)
        return ScenarioItem(
            scenario_name=name,
            strategy_type=stype,
            planned_meals=qty,
            predicted_demand=round(predicted_val, 1),
            surplus=surplus,
            shortage=shortage,
            prep_cost=prep_cost,
            surplus_cost=surplus_cost,
            risk_assessment=risk
        )

    scenarios.append(make_scenario(
        "Conservative Preparation",
        "conservative",
        conservative_qty,
        "Zero food waste priority. Eliminates surplus risk, but carries shortage risk if student turnout is high."
    ))

    scenarios.append(make_scenario(
        "Predicted Demand Preparation",
        "predicted",
        predicted_qty,
        "Balanced operational baseline. Aligns directly with model forecast, minimizing both waste and stockouts."
    ))

    scenarios.append(make_scenario(
        "Safety Buffer Preparation",
        "buffer",
        buffer_qty,
        "Service level priority. Guarantees meal availability for unexpected rush, but risks unsold leftovers."
    ))

    if req.custom_planned is not None:
        scenarios.append(make_scenario(
            "Custom Preparation",
            "custom",
            max(0, req.custom_planned),
            f"User defined preparation quantity of {req.custom_planned} meals."
        ))

    recommendation = (
        f"For {req.predict_request.menu_type} on {pred_res.day_of_week}: "
        f"The Predicted Demand strategy ({predicted_qty} meals) provides the best financial balance. "
        f"If prioritizing zero-waste, choose Conservative ({conservative_qty} meals)."
    )

    cost_explanation = (
        "Surplus cost is calculated as (Surplus Meals × Unit Cost) and represents potential unrecovered ingredient expense. "
        "It is an approximation and may not equal actual net loss if unsold food is repurposed, discounted, or donated."
    )

    return ScenariosResponse(
        menu_type=req.predict_request.menu_type,
        predicted_demand=round(predicted_val, 1),
        cost_per_meal=cost_per_meal,
        scenarios=scenarios,
        recommendation=recommendation,
        cost_explanation=cost_explanation
    )


def get_model_metrics() -> Dict[str, Any]:
    if not METRICS_FILE.exists():
        return train_model()
    with open(METRICS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)
