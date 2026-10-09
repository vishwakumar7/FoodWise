import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_path))

from app.main import app
from app.training import DATA_FILE, MODEL_FILE, METRICS_FILE, load_and_validate_data

client = TestClient(app)

def run_system_verification():
    print("=" * 60)
    print("FOODWISE AI SYSTEM VERIFICATION SUITE")
    print("=" * 60)

    # 1. Dataset Verification
    print("\n[1] Verifying Dataset...")
    assert DATA_FILE.exists(), f"Missing dataset file {DATA_FILE}"
    df = load_and_validate_data(DATA_FILE)
    assert len(df) >= 365, f"Expected at least 365 records, got {len(df)}"
    print(f"  Dataset contains {len(df)} validated records.")
    required_cols = ["Date", "Day of week", "Menu type", "Expected attendance", "Temperature", "Previous day's sales", "Holiday indicator", "Actual meals sold"]
    for col in required_cols:
        assert col in df.columns, f"Missing required column {col}"
    print("  All required feature & target columns present.")

    # 2. Model Artifacts Verification
    print("\n[2] Verifying Model Artifacts...")
    assert MODEL_FILE.exists(), f"Missing model pipeline artifact {MODEL_FILE}"
    assert METRICS_FILE.exists(), f"Missing model metrics artifact {METRICS_FILE}"
    metrics_res = client.get("/api/model-metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    print(f"  Trained Model: {metrics['model_name']}")
    print(f"  MAE: {metrics['mae']} meals | RMSE: {metrics['rmse']} meals | R2: {metrics['r2']}")
    print(f"  Baseline MAE: {metrics['baseline_mae']} meals | Improvement: +{metrics['improvement_percent']}%")
    assert metrics['r2'] > 0.85, f"Model R2 too low: {metrics['r2']}"
    assert metrics['mae'] < metrics['baseline_mae'], "Model did not beat baseline"
    print("  Model performance meets high accuracy threshold.")

    # 3. Prediction API & Sensitivity Verification
    print("\n[3] Verifying Prediction API & Sensitivity...")
    base_input = {
        "date": "2025-10-17",
        "menu_type": "Biryani",
        "expected_attendance": 200,
        "temperature": 28.0,
        "prev_day_sales": 120.0,
        "is_holiday": 0,
        "planned_meals": 120,
        "cost_per_meal": 65.0
    }
    high_input = {**base_input, "expected_attendance": 550}

    pred_base = client.post("/api/predict", json=base_input).json()
    pred_high = client.post("/api/predict", json=high_input).json()

    print(f"  Low Attendance (200) -> Predicted: {pred_base['predicted_meals']} meals")
    print(f"  High Attendance (550) -> Predicted: {pred_high['predicted_meals']} meals")
    assert pred_high['predicted_meals'] > pred_base['predicted_meals'], "Prediction should increase with attendance"
    assert pred_base['uncertainty_lower'] <= pred_base['predicted_meals'] <= pred_base['uncertainty_upper'] + 10, "Interval bounds invalid"
    print("  Model responds correctly to operational input shifts.")

    # 4. Scenario Calculations & Invariants
    print("\n[4] Verifying Scenario Calculations & Invariants...")
    scen_res = client.post("/api/scenarios", json={
        "predict_request": base_input,
        "conservative_factor": 0.85,
        "buffer_factor": 1.15
    }).json()

    for sc in scen_res['scenarios']:
        surplus = sc['surplus']
        shortage = sc['shortage']
        planned = sc['planned_meals']
        cost = sc['prep_cost']
        surplus_cost = sc['surplus_cost']

        # Mutual exclusivity invariant
        assert not (surplus > 0 and shortage > 0), f"Violation in {sc['scenario_name']}: both surplus ({surplus}) and shortage ({shortage}) are positive!"
        assert cost == round(planned * 65.0, 2), "Prep cost calculation mismatch"
        assert surplus_cost == round(surplus * 65.0, 2), "Surplus cost calculation mismatch"
        print(f"  {sc['scenario_name']}: Planned={planned}, Surplus={surplus}, Shortage={shortage}, Cost=Rs.{cost}")
    print("  Scenario invariants verified.")

    # 5. Waste Handling & Zero-Safe Checks
    print("\n[5] Verifying Waste Handling & Zero-Safe Division...")
    zero_waste_input = {
        "date": "2025-10-20",
        "menu_type": "Dosa",
        "meals_prepared": 0,
        "meals_sold": 0,
        "discarded_meals": 0,
        "cost_per_meal": 35.0,
        "notes": "Kitchen closed / zero batch test"
    }
    zero_res = client.post("/api/waste-records", json=zero_waste_input)
    assert zero_res.status_code == 200
    zero_data = zero_res.json()
    assert zero_data['waste_percentage'] == 0.0, "Zero division was not handled safely"
    assert zero_data['leftover_meals'] == 0
    print("  Zero meals prepared handled safely without division-by-zero error.")

    # 6. Invalid Input Error Handling
    print("\n[6] Verifying Invalid Input Error Rejection...")
    invalid_input = {
        "date": "2025-10-20",
        "menu_type": "Dosa",
        "meals_prepared": 50,
        "meals_sold": 100,  # Invalid: sold > prepared
        "discarded_meals": 0,
        "cost_per_meal": 35.0
    }
    inv_res = client.post("/api/waste-records", json=invalid_input)
    assert inv_res.status_code == 400, "API failed to reject invalid sales > prepared"
    print("  Invalid operational inputs properly rejected with HTTP 400.")

    print("\n" + "=" * 60)
    print("ALL 6 CRITICAL SYSTEM VALIDATIONS PASSED SUCCESSFULLY! [OK]")
    print("=" * 60)

if __name__ == "__main__":
    run_system_verification()
