import os
import uuid
import datetime
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd

from app.schemas import WasteRecordCreate, WasteRecordResponse
from app.training import DATA_DIR, MENU_TYPES

WASTE_FILE = DATA_DIR / "waste_records.csv"

WASTE_COLS = [
    "id",
    "date",
    "menu_type",
    "meals_prepared",
    "meals_sold",
    "discarded_meals",
    "cost_per_meal",
    "notes"
]


def init_seed_waste_records(file_path: Path = WASTE_FILE):
    """Initializes realistic baseline waste log records if file does not exist."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    if file_path.exists() and file_path.stat().st_size > 0:
        return

    # Seed with 14 days of realistic canteen operational logs
    seed_records = []
    base_date = datetime.date(2025, 10, 1)

    sample_plans = [
        ("Meals", 210, 195, 8, 45.0, "Smooth lunch service; slight rice leftover"),
        ("Biryani", 260, 255, 3, 75.0, "Friday special; nearly complete sellout"),
        ("Variety Rice", 110, 88, 14, 40.0, "Rainy cooler day; lower curd rice demand"),
        ("Dosa", 130, 125, 4, 35.0, "Evening snacks brisk sale"),
        ("Idli", 140, 122, 12, 30.0, "Sambar surplus preserved; idli discarded"),
        ("Meals", 200, 160, 28, 45.0, "Sudden afternoon symposium cancellation"),
        ("Biryani", 190, 175, 10, 75.0, "Midweek special; 5 meals donated to hostel"),
        ("Variety Rice", 95, 90, 3, 40.0, "Well tuned batch"),
        ("Dosa", 150, 148, 2, 35.0, "Weekend rush"),
        ("Meals", 220, 205, 12, 45.0, "Regular weekday"),
        ("Idli", 135, 110, 18, 30.0, "Monday morning exam period"),
        ("Biryani", 240, 230, 7, 75.0, "Festive Friday lunch"),
    ]

    for idx, (menu, prep, sold, disc, cost, notes) in enumerate(sample_plans):
        cur_date = base_date + datetime.timedelta(days=idx)
        seed_records.append({
            "id": f"WST-{1000 + idx}",
            "date": cur_date.strftime("%Y-%m-%d"),
            "menu_type": menu,
            "meals_prepared": prep,
            "meals_sold": sold,
            "discarded_meals": disc,
            "cost_per_meal": cost,
            "notes": notes
        })

    df = pd.DataFrame(seed_records)
    df.to_csv(file_path, index=False)
    print(f"Initialized seed waste records in {file_path}")


def load_waste_records_df() -> pd.DataFrame:
    init_seed_waste_records(WASTE_FILE)
    try:
        df = pd.read_csv(WASTE_FILE)
        # Ensure correct column presence
        for col in WASTE_COLS:
            if col not in df.columns:
                df[col] = ""
        return df
    except Exception:
        init_seed_waste_records(WASTE_FILE)
        return pd.read_csv(WASTE_FILE)


def add_waste_record(record: WasteRecordCreate) -> WasteRecordResponse:
    df = load_waste_records_df()

    record_id = f"WST-{int(datetime.datetime.now().timestamp()) % 100000}"
    new_row = {
        "id": record_id,
        "date": record.date,
        "menu_type": record.menu_type,
        "meals_prepared": int(record.meals_prepared),
        "meals_sold": int(record.meals_sold),
        "discarded_meals": int(record.discarded_meals),
        "cost_per_meal": float(record.cost_per_meal),
        "notes": record.notes or ""
    }

    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    df.to_csv(WASTE_FILE, index=False)

    prep = new_row["meals_prepared"]
    sold = new_row["meals_sold"]
    disc = new_row["discarded_meals"]
    cost = new_row["cost_per_meal"]

    leftover = max(0, prep - sold)
    waste_pct = round((disc / prep * 100.0), 2) if prep > 0 else 0.0
    wasted_cost = round(disc * cost, 2)

    return WasteRecordResponse(
        id=record_id,
        date=new_row["date"],
        menu_type=new_row["menu_type"],
        meals_prepared=prep,
        meals_sold=sold,
        leftover_meals=leftover,
        discarded_meals=disc,
        waste_percentage=waste_pct,
        wasted_cost=wasted_cost,
        cost_per_meal=cost,
        notes=new_row["notes"]
    )


def get_all_waste_records() -> List[WasteRecordResponse]:
    df = load_waste_records_df()
    results: List[WasteRecordResponse] = []

    for _, row in df.iterrows():
        try:
            prep = int(row["meals_prepared"])
            sold = int(row["meals_sold"])
            disc = int(row["discarded_meals"])
            cost = float(row["cost_per_meal"])
            leftover = max(0, prep - sold)
            waste_pct = round((disc / prep * 100.0), 2) if prep > 0 else 0.0
            wasted_cost = round(disc * cost, 2)

            results.append(WasteRecordResponse(
                id=str(row["id"]),
                date=str(row["date"]),
                menu_type=str(row["menu_type"]),
                meals_prepared=prep,
                meals_sold=sold,
                leftover_meals=leftover,
                discarded_meals=disc,
                waste_percentage=waste_pct,
                wasted_cost=wasted_cost,
                cost_per_meal=cost,
                notes=str(row.get("notes", ""))
            ))
        except Exception:
            continue

    # Return descending by date
    results.sort(key=lambda x: x.date, reverse=True)
    return results


def get_waste_analytics_summary() -> Dict[str, Any]:
    records = get_all_waste_records()
    if not records:
        return {
            "total_records": 0,
            "avg_waste_pct": 0.0,
            "total_discarded": 0,
            "total_wasted_cost": 0.0,
            "menu_waste_breakdown": [],
            "waste_trend": []
        }

    total_prep = sum(r.meals_prepared for r in records)
    total_disc = sum(r.discarded_meals for r in records)
    total_cost = sum(r.wasted_cost for r in records)
    avg_waste_pct = round((total_disc / total_prep * 100.0), 2) if total_prep > 0 else 0.0

    # Group by menu type
    menu_groups: Dict[str, Dict[str, Any]] = {}
    for r in records:
        if r.menu_type not in menu_groups:
            menu_groups[r.menu_type] = {"prep": 0, "sold": 0, "disc": 0, "cost": 0.0}
        menu_groups[r.menu_type]["prep"] += r.meals_prepared
        menu_groups[r.menu_type]["sold"] += r.meals_sold
        menu_groups[r.menu_type]["disc"] += r.discarded_meals
        menu_groups[r.menu_type]["cost"] += r.wasted_cost

    menu_breakdown = []
    for menu, stats in menu_groups.items():
        p = stats["prep"]
        d = stats["disc"]
        menu_breakdown.append({
            "menu_type": menu,
            "total_prepared": p,
            "total_discarded": d,
            "waste_percentage": round((d / p * 100.0), 1) if p > 0 else 0.0,
            "wasted_cost": round(stats["cost"], 2)
        })
    menu_breakdown.sort(key=lambda x: x["waste_percentage"], reverse=True)

    # Waste trend chronologically
    sorted_asc = sorted(records, key=lambda x: x.date)
    waste_trend = [
        {
            "date": r.date,
            "menu_type": r.menu_type,
            "meals_prepared": r.meals_prepared,
            "meals_sold": r.meals_sold,
            "leftover_meals": r.leftover_meals,
            "discarded_meals": r.discarded_meals,
            "waste_percentage": r.waste_percentage,
            "wasted_cost": r.wasted_cost
        }
        for r in sorted_asc
    ]

    return {
        "total_records": len(records),
        "avg_waste_pct": avg_waste_pct,
        "total_discarded": total_disc,
        "total_wasted_cost": round(total_cost, 2),
        "menu_waste_breakdown": menu_breakdown,
        "waste_trend": waste_trend
    }
