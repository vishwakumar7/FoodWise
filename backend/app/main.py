import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import (
    PredictRequest,
    PredictResponse,
    ScenariosRequest,
    ScenariosResponse,
    WasteRecordCreate,
    WasteRecordResponse,
    ModelMetricsResponse,
    DashboardSummary,
    HistoricalRecord
)
from app.model import (
    predict_demand,
    evaluate_scenarios,
    get_model_metrics,
    reload_model_pipeline,
    get_model_pipeline
)
from app.training import (
    train_model,
    generate_synthetic_dataset,
    DATA_FILE,
    ARTIFACTS_DIR
)
from app.analytics import (
    get_dashboard_summary,
    query_historical_records,
    get_analytics_charts_data
)
from app.waste import (
    add_waste_record,
    get_all_waste_records,
    get_waste_analytics_summary
)

app = FastAPI(
    title="FoodWise AI API",
    description="Intelligent food demand forecasting and waste reduction engine for college canteens.",
    version="1.0.0"
)

# Enable CORS for local frontend Vite origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Ensure data exists, seed waste logs, and model is loaded on startup."""
    try:
        if not DATA_FILE.exists():
            print("Dataset file not detected. Generating reproducible synthetic dataset...")
            generate_synthetic_dataset(DATA_FILE)
        get_model_pipeline()
    except Exception as e:
        print(f"Warning during startup initialization: {e}")


@app.get("/api/health", tags=["System"])
def get_health() -> Dict[str, Any]:
    """Health check endpoint returning system status and model readiness."""
    try:
        pipeline = get_model_pipeline()
        model_ready = pipeline is not None
    except Exception:
        model_ready = False

    return {
        "status": "healthy",
        "service": "FoodWise AI Backend",
        "model_loaded": model_ready,
        "dataset_present": DATA_FILE.exists(),
        "algorithm": "RandomForestRegressor"
    }


@app.get("/api/summary", tags=["Dashboard"])
def get_summary() -> DashboardSummary:
    """Returns dataset summary metrics and high-level dashboard KPIs."""
    try:
        waste_stats = get_waste_analytics_summary()
        summary = get_dashboard_summary(waste_summary=waste_stats)
        return DashboardSummary(**summary)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing dashboard summary: {str(e)}"
        )


@app.get("/api/history", response_model=List[HistoricalRecord], tags=["Analytics"])
def get_history(
    menu_type: Optional[str] = Query(None, description="Filter by menu category"),
    day_of_week: Optional[str] = Query(None, description="Filter by day of week"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    limit: int = Query(200, ge=1, le=1000, description="Max records to return")
):
    """Retrieve historical demand records with flexible filtering."""
    try:
        records = query_historical_records(
            menu_type=menu_type,
            day_of_week=day_of_week,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        return records
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving historical records: {str(e)}"
        )


@app.get("/api/charts", tags=["Analytics"])
def get_charts(menu_type: Optional[str] = Query(None)):
    """Retrieve structured time-series and breakdown chart data for Recharts."""
    try:
        charts_data = get_analytics_charts_data(menu_type=menu_type)
        waste_summary = get_waste_analytics_summary()
        return {
            "analytics": charts_data,
            "waste": waste_summary
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating chart data: {str(e)}"
        )


@app.post("/api/predict", response_model=PredictResponse, tags=["Prediction"])
def predict(payload: PredictRequest):
    """
    Generate demand prediction using the trained Random Forest model.
    Includes defensible tree-ensemble uncertainty intervals and cost analysis.
    """
    try:
        return predict_demand(payload)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction inference failed: {str(e)}"
        )


@app.post("/api/scenarios", response_model=ScenariosResponse, tags=["Scenarios"])
def scenarios(payload: ScenariosRequest):
    """
    Evaluates multiple preparation strategies (Conservative, Predicted Demand,
    Safety Buffer, and Custom) for what-if trade-off analysis.
    """
    try:
        return evaluate_scenarios(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scenario evaluation failed: {str(e)}"
        )


@app.get("/api/model-metrics", response_model=ModelMetricsResponse, tags=["Model"])
def model_metrics():
    """Returns training evaluation metrics (MAE, RMSE, R²), baseline comparisons, and feature importances."""
    try:
        metrics = get_model_metrics()
        return ModelMetricsResponse(**metrics)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching model metrics: {str(e)}"
        )


@app.post("/api/train", tags=["Model"])
def train():
    """Triggers retraining of the Random Forest model on the dataset and reloads the pipeline."""
    try:
        metrics = train_model(DATA_FILE, ARTIFACTS_DIR)
        reload_model_pipeline()
        return {
            "status": "success",
            "message": "Model retrained and reloaded successfully.",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining failed: {str(e)}"
        )


@app.post("/api/waste-records", response_model=WasteRecordResponse, tags=["Waste Tracker"])
def create_waste_record(payload: WasteRecordCreate):
    """Validates and appends a food preparation and waste operational record."""
    try:
        if payload.meals_sold > payload.meals_prepared:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Meals sold cannot exceed meals prepared."
            )
        if payload.discarded_meals > payload.meals_prepared:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Discarded meals cannot exceed total meals prepared."
            )
        record = add_waste_record(payload)
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save waste record: {str(e)}"
        )


@app.get("/api/waste-records", response_model=List[WasteRecordResponse], tags=["Waste Tracker"])
def get_waste_records():
    """Retrieves all logged waste tracking records."""
    try:
        return get_all_waste_records()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch waste records: {str(e)}"
        )
