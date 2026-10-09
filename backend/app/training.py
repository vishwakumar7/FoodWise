import os
import json
import datetime
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
import joblib

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
DATA_FILE = DATA_DIR / "food_demand.csv"
MODEL_FILE = ARTIFACTS_DIR / "foodwise_rf_pipeline.joblib"
METRICS_FILE = ARTIFACTS_DIR / "model_metrics.json"

MENU_TYPES = ["Meals", "Variety Rice", "Biryani", "Dosa", "Idli"]
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

FEATURE_COLS = [
    "Day of week",
    "Menu type",
    "Expected attendance",
    "Temperature",
    "Previous day's sales",
    "Holiday indicator"
]
TARGET_COL = "Actual meals sold"


def generate_synthetic_dataset(output_path: Path = DATA_FILE, n_days: int = 365, seed: int = 42) -> pd.DataFrame:
    """
    Generates a reproducible, clearly-labelled synthetic dataset modeling canteen demand
    with realistic variations across menu types, weekdays, attendance, temperature, and holidays.
    """
    np.random.seed(seed)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    start_date = datetime.date(2025, 1, 1)
    dates = [start_date + datetime.timedelta(days=i) for i in range(n_days)]

    # Academic calendar holidays / breaks simulation
    fixed_holidays = {
        (1, 1), (1, 14), (1, 15), (1, 26), (4, 14), (5, 1),
        (8, 15), (10, 2), (10, 20), (11, 1), (12, 25)
    }

    records = []
    
    # Track previous day's sales per menu item for realistic lag feature
    prev_sales_tracker = {
        "Meals": 160.0,
        "Variety Rice": 85.0,
        "Biryani": 110.0,
        "Dosa": 105.0,
        "Idli": 115.0
    }

    for current_date in dates:
        weekday_idx = current_date.weekday()
        weekday_name = WEEKDAYS[weekday_idx]
        is_weekend = 1 if weekday_idx in [5, 6] else 0
        is_fixed_holiday = 1 if (current_date.month, current_date.day) in fixed_holidays else 0
        is_holiday = 1 if (is_weekend == 1 or is_fixed_holiday == 1) else 0

        # Day of year seasonal temperature variation (Tropical/Subtropical college climate)
        day_of_year = current_date.timetuple().tm_yday
        base_temp = 28.0 + 7.0 * np.sin((day_of_year - 80) * 2 * np.pi / 365.0)
        temp_noise = np.random.normal(0, 1.8)
        temperature = round(float(np.clip(base_temp + temp_noise, 18.0, 42.0)), 1)

        # Base campus attendance:
        # Regular weekday: 380 - 520 students
        # Friday: slightly lower after lunch
        # Weekend / holiday: 80 - 180 hostelers/duty staff
        if is_holiday:
            attendance = int(np.random.normal(130, 25))
        elif weekday_idx == 4: # Friday
            attendance = int(np.random.normal(410, 35))
        else:
            attendance = int(np.random.normal(460, 40))
        attendance = max(50, min(650, attendance))

        for menu in MENU_TYPES:
            prev_sales = prev_sales_tracker[menu]

            # Realistic demand generation physics:
            # Ratio of attendees ordering this menu
            if menu == "Meals":
                # Standard full lunch staple
                base_share = 0.38 if not is_holiday else 0.42
                if temperature > 34:
                    base_share *= 0.90 # high heat reduces heavy meal appetite
                if weekday_idx == 4: # Friday Biryani competition
                    base_share *= 0.72
                demand_factor = base_share * attendance
                noise = np.random.normal(0, 12)
                momentum = 0.15 * (prev_sales - 160)

            elif menu == "Biryani":
                # Friday / Sunday feast favorite
                if weekday_name == "Friday":
                    base_share = 0.52
                elif weekday_name == "Sunday":
                    base_share = 0.48
                elif is_holiday:
                    base_share = 0.35
                else:
                    base_share = 0.20 # regular weekday special
                demand_factor = base_share * attendance
                noise = np.random.normal(0, 15)
                momentum = 0.10 * (prev_sales - 100)

            elif menu == "Variety Rice":
                # Lemon rice, curd rice, tomato rice - popular in hot weather
                base_share = 0.22 if not is_holiday else 0.26
                if temperature > 32:
                    base_share *= 1.25 # Cold curd rice & light lunch spike
                demand_factor = base_share * attendance
                noise = np.random.normal(0, 10)
                momentum = 0.12 * (prev_sales - 85)

            elif menu == "Dosa":
                # High weekend evening & breakfast demand
                base_share = 0.25 if not is_holiday else 0.35
                if weekday_name in ["Saturday", "Sunday"]:
                    base_share *= 1.30
                demand_factor = base_share * attendance
                noise = np.random.normal(0, 11)
                momentum = 0.15 * (prev_sales - 105)

            elif menu == "Idli":
                # Morning classic staple, steady
                base_share = 0.26 if not is_holiday else 0.28
                if weekday_name == "Monday":
                    base_share *= 1.15
                demand_factor = base_share * attendance
                noise = np.random.normal(0, 10)
                momentum = 0.12 * (prev_sales - 110)

            actual_demand = demand_factor + momentum + noise
            actual_demand = int(max(10, round(actual_demand)))

            records.append({
                "Date": current_date.strftime("%Y-%m-%d"),
                "Day of week": weekday_name,
                "Menu type": menu,
                "Expected attendance": attendance,
                "Temperature": temperature,
                "Previous day's sales": round(prev_sales, 1),
                "Holiday indicator": is_holiday,
                "Actual meals sold": actual_demand
            })

            # Update tracker with today's sales
            prev_sales_tracker[menu] = float(actual_demand)

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Synthetic dataset saved with {len(df)} records across {n_days} days to {output_path}")
    return df


def load_and_validate_data(csv_path: Path = DATA_FILE) -> pd.DataFrame:
    """Loads and validates dataset schema and types."""
    if not csv_path.exists():
        print(f"Data file not found at {csv_path}. Generating reproducible dataset...")
        return generate_synthetic_dataset(csv_path)

    df = pd.read_csv(csv_path)
    required_cols = FEATURE_COLS + [TARGET_COL, "Date"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    # Data cleaning & validation
    df = df.dropna(subset=required_cols).copy()
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values(by=["Date", "Menu type"]).reset_index(drop=True)
    df["Expected attendance"] = df["Expected attendance"].astype(int)
    df["Temperature"] = df["Temperature"].astype(float)
    df["Previous day's sales"] = df["Previous day's sales"].astype(float)
    df["Holiday indicator"] = df["Holiday indicator"].astype(int)
    df["Actual meals sold"] = df["Actual meals sold"].astype(int)
    return df


def train_model(data_path: Path = DATA_FILE, artifacts_dir: Path = ARTIFACTS_DIR) -> dict:
    """
    Trains Random Forest Regressor and baseline model using time-series split.
    Calculates evaluation metrics, feature importances, and sample predictions.
    Saves model artifact and metrics.
    """
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    df = load_and_validate_data(data_path)

    if len(df) < 50:
        raise ValueError(f"Insufficient training data. Found only {len(df)} records (minimum 50 required).")

    # Time-series aware split: Train on first 80% chronologically, test on recent 20%
    # This prevents temporal target leakage
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    X_train = train_df[FEATURE_COLS]
    y_train = train_df[TARGET_COL].values
    X_test = test_df[FEATURE_COLS]
    y_test = test_df[TARGET_COL].values

    # Preprocessing
    categorical_features = ["Day of week", "Menu type"]
    numerical_features = ["Expected attendance", "Temperature", "Previous day's sales", "Holiday indicator"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(categories=[WEEKDAYS, MENU_TYPES], handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", StandardScaler(), numerical_features)
        ],
        remainder="drop"
    )

    # Main Model: Random Forest Regressor
    rf_regressor = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", rf_regressor)
    ])

    # Fit RF Model
    rf_pipeline.fit(X_train, y_train)

    # Baseline Model: Dummy Regressor (predicts mean of training target)
    baseline_model = DummyRegressor(strategy="mean")
    baseline_model.fit(X_train, y_train)

    # Predictions
    y_pred_rf = rf_pipeline.predict(X_test)
    y_pred_base = baseline_model.predict(X_test)

    # Evaluation Metrics
    rf_mae = float(mean_absolute_error(y_test, y_pred_rf))
    rf_rmse = float(root_mean_squared_error(y_test, y_pred_rf))
    rf_r2 = float(r2_score(y_test, y_pred_rf))

    base_mae = float(mean_absolute_error(y_test, y_pred_base))
    base_rmse = float(root_mean_squared_error(y_test, y_pred_base))
    base_r2 = float(r2_score(y_test, y_pred_base))

    improvement_percent = float(max(0.0, ((base_mae - rf_mae) / base_mae) * 100))

    # Feature Importances extraction
    ohe = rf_pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    cat_names = list(ohe.get_feature_names_out(categorical_features))
    all_feature_names = cat_names + numerical_features
    importances = rf_pipeline.named_steps["regressor"].feature_importances_
    feature_importance_dict = {
        name: round(float(imp), 4)
        for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    }

    # Generate sample actual vs predicted test records for visualization
    sample_indices = np.linspace(0, len(test_df) - 1, min(60, len(test_df)), dtype=int)
    sample_records = []
    for idx in sample_indices:
        row = test_df.iloc[idx]
        actual_val = int(row[TARGET_COL])
        pred_val = round(float(y_pred_rf[idx]), 1)
        sample_records.append({
            "date": row["Date"].strftime("%Y-%m-%d"),
            "menu_type": row["Menu type"],
            "actual": actual_val,
            "predicted": pred_val,
            "error": round(pred_val - actual_val, 1)
        })

    # Save fitted model pipeline
    joblib.dump(rf_pipeline, MODEL_FILE)
    print(f"Model pipeline successfully saved to {MODEL_FILE}")

    metrics = {
        "model_name": "FoodWise Random Forest Demand Forecaster",
        "algorithm": "RandomForestRegressor (100 estimators)",
        "n_estimators": 100,
        "train_records": len(train_df),
        "test_records": len(test_df),
        "mae": round(rf_mae, 2),
        "rmse": round(rf_rmse, 2),
        "r2": round(rf_r2, 4),
        "baseline_mae": round(base_mae, 2),
        "baseline_rmse": round(base_rmse, 2),
        "baseline_r2": round(base_r2, 4),
        "improvement_percent": round(improvement_percent, 1),
        "feature_importances": feature_importance_dict,
        "sample_test_predictions": sample_records,
        "is_synthetic": True,
        "data_notice": "Trained on synthetic campus canteen simulation data with realistic seasonal, weekday, and attendance distributions. For demonstration only.",
        "last_trained": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(METRICS_FILE, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Metrics saved to {METRICS_FILE}: MAE={metrics['mae']}, RMSE={metrics['rmse']}, R2={metrics['r2']}")
    return metrics


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        generate_synthetic_dataset(DATA_FILE)
    train_model(DATA_FILE, ARTIFACTS_DIR)
