# FoodWise AI — Interactive Machine Learning Web Application

> **Tagline:** Predict Demand. Reduce Waste. Make Smarter Decisions.

**FoodWise AI** is an intelligent food demand forecasting and waste reduction platform engineered for college canteens, university dining halls, cafeterias, and institutional food service providers.

The platform uses a scikit-learn **Random Forest Regressor** to predict meal quantities across menu types based on historical sales, campus attendance, day of the week, weather conditions, and academic schedule indicators. Users can run operational what-if scenarios, compare preparation strategies, and track actual kitchen waste to reduce avoidable leftovers.

---

## Key Features

1. **Executive KPI Dashboard**: Real-time operational cards tracking Predicted Meals Today, Planned Meals, Estimated Surplus, Estimated Shortage, Direct Preparation Cost, and Estimated Surplus Cost.
2. **Interactive Demand Predictor**: Live ML inference with defensible tree-ensemble 80% prediction intervals ($\pm\sigma$ variance across 100 decision trees) instead of arbitrary percentage confidence scores.
3. **What-If Scenario Simulator**: Side-by-side trade-off evaluation comparing **Conservative Preparation** (lean / zero waste priority), **Predicted Demand** (balanced ML baseline), and **Safety Buffer** (service level / no stockout priority) with customizable batch quantities and financial impact analysis.
4. **Prediction Sensitivity Lab**: Interactive sensitivity tool comparing two operational variants side-by-side (e.g. attendance surges from 100 to 500, weekday vs holiday schedules, weather shifts) with visual response curves.
5. **Historical Consumption Analytics**: Interactive Recharts visualizations covering multi-item daily trends, weekday consumption distributions, menu share breakdowns, attendance correlation scatter plots, and holdout test set actual vs. predicted curves.
6. **Kitchen Waste Operational Tracker**: Daily shift logging distinguishing **leftover food** (repurposed / donated) from **discarded food** (waste). Stored persistently in CSV with zero-safe waste rate calculations.
7. **Model Diagnostics & Retraining**: Live performance benchmark (MAE, RMSE, $R^2$) against a mean baseline dummy model, feature importances ranking, and on-demand model retraining via the API.

---

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Framer Motion
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic v2
- **Machine Learning**: scikit-learn (`RandomForestRegressor`, `ColumnTransformer`, `OneHotEncoder`, `StandardScaler`), pandas, NumPy, joblib
- **Data Persistence**: CSV (`backend/data/food_demand.csv`, `backend/data/waste_records.csv`)
- **API Communication**: REST API with CORS middleware and Vite proxy

---

## Dataset Schema

The system uses a reproducible campus canteen operational dataset (`backend/data/food_demand.csv`) covering 365 days across 5 menu categories (1,825 records):

| Column | Type | Description |
| :--- | :--- | :--- |
| `Date` | `YYYY-MM-DD` | Calendar date |
| `Day of week` | `string` | Monday through Sunday |
| `Menu type` | `string` | `Meals`, `Variety Rice`, `Biryani`, `Dosa`, `Idli` |
| `Expected attendance` | `integer` | Estimated student/faculty population (50–650) |
| `Temperature` | `float` | Ambient temperature in °C (18.0–42.0) |
| `Previous day's sales` | `float` | Lag-1 demand volume for that menu category |
| `Holiday indicator` | `integer` | `1` for holidays/vacations/weekends, `0` for regular college days |
| `Actual meals sold` | `integer` | **Target variable** |

> **Dataset Notice & Limitations**: Historical records are generated using a reproducible canteen simulation modeling realistic weekday variations, menu-specific popularity spikes (e.g., Biryani on Fridays), and weather effects. The dataset is explicitly designated for prototype validation and demonstration; real-world deployment requires actual POS kitchen register exports.

---

## Project Structure

```text
k:/Clg/Food/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI routes & middleware
│   │   ├── schemas.py         # Pydantic v2 validation models
│   │   ├── model.py           # Model inference & tree-ensemble uncertainty
│   │   ├── training.py        # ML training pipeline & synthetic data generator
│   │   ├── analytics.py       # Time-series aggregations & queries
│   │   └── waste.py           # CSV-backed waste tracking & zero-safe formulas
│   ├── data/
│   │   ├── food_demand.csv    # 1,825 historical training records
│   │   └── waste_records.csv  # Kitchen operational shift logs
│   ├── artifacts/
│   │   ├── foodwise_rf_pipeline.joblib  # Trained model & preprocessing pipeline
│   │   └── model_metrics.json          # MAE, RMSE, R2, feature importances
│   ├── requirements.txt
│   └── test_api.py            # Endpoint integration tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── KpiCard.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PredictionPage.tsx
│   │   │   ├── ScenariosPage.tsx
│   │   │   ├── PredictionLabPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── WastePage.tsx
│   │   │   └── ModelPage.tsx
│   │   ├── services/
│   │   │   └── api.ts         # Frontend API client
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── test_system.py             # Full end-to-end invariant validation suite
├── README.md
└── .gitignore
```

---

## Installation & Setup Instructions

### Prerequisites
- Python 3.10+ (tested with Python 3.13)
- Node.js 18+ and npm (tested with Node v22.20.0)
- Windows PowerShell

### 1. Install Backend Dependencies
Open Windows PowerShell in the project root:
```powershell
cd k:\Clg\Food\backend
python -m pip install -r requirements.txt
```

### 2. Generate Dataset & Train Model
The training pipeline automatically validates the dataset, generates reproducible records if missing, trains the Random Forest model with a chronological 80/20 split, and outputs evaluation metrics:
```powershell
cd k:\Clg\Food
python backend/app/training.py
```

### 3. Install Frontend Dependencies
```powershell
cd k:\Clg\Food\frontend
npm install
```

---

## Running the Application

### Start Backend API Server
In a PowerShell terminal:
```powershell
cd k:\Clg\Food\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI server will be active at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

### Start Frontend Application
In a separate PowerShell terminal:
```powershell
cd k:\Clg\Food\frontend
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## Backend API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and model status |
| `GET` | `/api/summary` | Dataset metadata and dashboard KPI aggregates |
| `GET` | `/api/history` | Filterable historical demand records (`menu_type`, `day_of_week`, date range) |
| `GET` | `/api/charts` | Formatted chart time series and distributions |
| `POST` | `/api/predict` | Random Forest demand inference with prediction interval |
| `POST` | `/api/scenarios` | What-if preparation comparison (Conservative, Predicted, Buffer, Custom) |
| `GET` | `/api/model-metrics` | Model evaluation scores (MAE, RMSE, $R^2$), baseline comparison, feature weights |
| `POST` | `/api/train` | Triggers pipeline retraining on the dataset |
| `POST` | `/api/waste-records` | Validates and appends a operational shift waste log |
| `GET` | `/api/waste-records` | Retrieves all logged operational waste records |

---

## Verification & Automated Tests

To run the complete verification suite checking model performance, scenario mutual exclusivity invariants, and zero-safe waste handling:
```powershell
cd k:\Clg\Food
python test_system.py
```
Expected output:
```text
ALL 6 CRITICAL SYSTEM VALIDATIONS PASSED SUCCESSFULLY! [OK]
```
