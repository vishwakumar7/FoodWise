import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.main import app

client = TestClient(app)

def test_all_endpoints():
    print("Testing /api/health...")
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("  Health:", res.json())

    print("Testing /api/summary...")
    res = client.get("/api/summary")
    assert res.status_code == 200, res.text
    print("  Summary:", res.json())

    print("Testing /api/history...")
    res = client.get("/api/history?limit=5")
    assert res.status_code == 200, res.text
    data = res.json()
    assert len(data) > 0
    print(f"  History records returned: {len(data)}, sample: {data[0]}")

    print("Testing /api/predict...")
    payload = {
        "date": "2025-10-15",
        "menu_type": "Biryani",
        "expected_attendance": 350,
        "temperature": 29.0,
        "prev_day_sales": 150.0,
        "is_holiday": 0,
        "planned_meals": 160,
        "cost_per_meal": 60.0
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200, res.text
    pred_data = res.json()
    print("  Predict result:", pred_data)
    assert pred_data["predicted_meals"] > 0
    assert not (pred_data["surplus"] > 0 and pred_data["shortage"] > 0), "Surplus and shortage cannot both be > 0"

    print("Testing /api/scenarios...")
    scenario_payload = {
        "predict_request": payload,
        "conservative_factor": 0.85,
        "buffer_factor": 1.15
    }
    res = client.post("/api/scenarios", json=scenario_payload)
    assert res.status_code == 200, res.text
    scen_data = res.json()
    print("  Scenarios:", len(scen_data["scenarios"]), "scenarios generated")

    print("Testing /api/model-metrics...")
    res = client.get("/api/model-metrics")
    assert res.status_code == 200, res.text
    metrics_data = res.json()
    print(f"  Model MAE: {metrics_data['mae']}, RMSE: {metrics_data['rmse']}, R2: {metrics_data['r2']}")

    print("Testing /api/waste-records (POST)...")
    waste_payload = {
        "date": "2025-10-16",
        "menu_type": "Biryani",
        "meals_prepared": 150,
        "meals_sold": 142,
        "discarded_meals": 4,
        "cost_per_meal": 60.0,
        "notes": "Test automated log entry"
    }
    res = client.post("/api/waste-records", json=waste_payload)
    assert res.status_code == 200, res.text
    waste_res = res.json()
    print("  Created waste record:", waste_res)
    assert waste_res["leftover_meals"] == 8
    assert waste_res["waste_percentage"] == round(4/150*100, 2)

    print("Testing /api/waste-records (GET)...")
    res = client.get("/api/waste-records")
    assert res.status_code == 200, res.text
    waste_list = res.json()
    print(f"  Total waste records: {len(waste_list)}")

    print("Testing /api/charts...")
    res = client.get("/api/charts?menu_type=Biryani")
    assert res.status_code == 200, res.text
    charts_data = res.json()
    print(f"  Charts daily trend points: {len(charts_data['analytics']['daily_trend'])}")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! [PASSED]")

if __name__ == "__main__":
    test_all_endpoints()
