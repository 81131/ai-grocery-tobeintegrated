import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

# Global store for the latest computed ML insights
_LATEST_INSIGHTS = []
_LAST_TRAINED = None

def _sanitize(obj):
    """Recursively convert numpy types to JSON-safe Python natives."""
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        v = float(obj)
        return 0.0 if (v != v) else v   # NaN → 0.0
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    return obj


def filter_outliers_iqr(df, column="purchase_cost"):
    if df.empty or len(df) < 5:
        return df, 0
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    initial_count = len(df)
    filtered_df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
    return filtered_df, initial_count - len(filtered_df)


def _predict_for_offset_months(rf, base_date, offset_months, avg_cost, avg_shelf_life, avg_ratio):
    """Run inference for a future date offset by N months."""
    future_dt = base_date + timedelta(days=30 * offset_months)
    X_pred = pd.DataFrame([{
        'year': future_dt.year,
        'month': future_dt.month,
        'purchase_cost': avg_cost,
        'shelf_life_days': avg_shelf_life,
        'price_to_cost_ratio': avg_ratio,
        'demand_volatility': 0.0,   # unknown future — use 0 as neutral
        'shelf_utilisation': max(0.0, 1.0 - offset_months / 3.0),  # decays
    }])
    return max(0, round(rf.predict(X_pred)[0]))


def train_forecaster(db_session):
    global _LATEST_INSIGHTS, _LAST_TRAINED
    from models.inventory import Product, StockBatch
    from models.orders import OrderItem, Order
    from sqlalchemy import text

    # ── Fetch raw sales data with batch shelf-life info ─────────────────────
    query = """
    SELECT 
        sb.product_id,
        o.created_at                AS order_date,
        oi.quantity                 AS demand_qty,
        sb.buying_price             AS purchase_cost,
        sb.retail_price,
        sb.manufacture_date,
        sb.expiry_date
    FROM order_items oi
    JOIN orders   o  ON o.id  = oi.order_id
    JOIN stock_batches sb ON sb.id = oi.batch_id
    """

    df = pd.read_sql(text(query), db_session.bind)
    if df.empty:
        return {"status": "error", "message": "No historical data to train on."}

    # ── Date normalisation ───────────────────────────────────────────────────
    df['order_date']       = pd.to_datetime(df['order_date'],       utc=True).dt.tz_localize(None)
    df['manufacture_date'] = pd.to_datetime(df['manufacture_date'], utc=True, errors='coerce').dt.tz_localize(None)
    df['expiry_date']      = pd.to_datetime(df['expiry_date'],       utc=True, errors='coerce').dt.tz_localize(None)
    df['month']            = df['order_date'].dt.month
    df['year']             = df['order_date'].dt.year

    # ── Shelf-life features ──────────────────────────────────────────────────
    df['shelf_life_days'] = (df['expiry_date'] - df['manufacture_date']).dt.days.fillna(90).clip(lower=1)
    df['days_to_expiry']  = (df['expiry_date'] - df['order_date']).dt.days.fillna(90).clip(lower=0)
    df['shelf_utilisation'] = (df['days_to_expiry'] / df['shelf_life_days']).clip(0, 1).fillna(0.5)

    # ── Derived features ─────────────────────────────────────────────────────
    df['price_to_cost_ratio'] = (df['retail_price'] / df['purchase_cost'].replace(0, np.nan)).fillna(1.5).clip(1.0, 5.0)

    products = db_session.query(Product).all()
    insights = []
    current_date = datetime.now()

    for p in products:
        p_df = df[df['product_id'] == p.id].copy()

        if len(p_df) < 10:
            insights.append({
                "product_id": p.id,
                "product_name": p.product_name,
                "status": "Insufficient Data",
                "outliers_removed": 0,
                "history": []
            })
            continue

        # ── Outlier removal ──────────────────────────────────────────────────
        p_df, outliers_count = filter_outliers_iqr(p_df, column="purchase_cost")

        # ── Monthly aggregation ──────────────────────────────────────────────
        monthly = p_df.groupby(['year', 'month']).agg(
            demand_qty       = ('demand_qty',       'sum'),
            purchase_cost    = ('purchase_cost',    'mean'),
            retail_price     = ('retail_price',     'mean'),
            shelf_life_days  = ('shelf_life_days',  'mean'),
            shelf_utilisation= ('shelf_utilisation','mean'),
            price_to_cost_ratio=('price_to_cost_ratio','mean'),
        ).reset_index().sort_values(['year','month'])

        if len(monthly) < 3:
            insights.append({
                "product_id": p.id,
                "product_name": p.product_name,
                "status": "Insufficient Monthly Groupings",
                "outliers_removed": outliers_count,
                "history": []
            })
            continue

        # ── Demand volatility (trailing 3 months rolling std) ────────────────
        monthly['demand_volatility'] = monthly['demand_qty'].rolling(3, min_periods=1).std().fillna(0)

        # ── Train model ──────────────────────────────────────────────────────
        feature_cols = ['year', 'month', 'purchase_cost', 'shelf_life_days',
                        'price_to_cost_ratio', 'demand_volatility', 'shelf_utilisation']
        X = monthly[feature_cols]
        y = monthly['demand_qty']

        rf = RandomForestRegressor(
            n_estimators=150,
            max_depth=8,
            min_samples_split=2,
            random_state=42
        )
        rf.fit(X, y)

        # ── Recent averages for forecasting ──────────────────────────────────
        recent = monthly.tail(3)
        avg_cost        = recent['purchase_cost'].mean()
        avg_retail      = recent['retail_price'].mean()
        avg_shelf_life  = recent['shelf_life_days'].mean()
        avg_ratio       = recent['price_to_cost_ratio'].mean()
        demand_vol      = monthly['demand_volatility'].tail(3).mean()

        # ── Multi-horizon predictions ─────────────────────────────────────────
        pred_30d  = _predict_for_offset_months(rf, current_date, 1,  avg_cost, avg_shelf_life, avg_ratio)
        pred_90d  = _predict_for_offset_months(rf, current_date, 3,  avg_cost, avg_shelf_life, avg_ratio)
        pred_180d = _predict_for_offset_months(rf, current_date, 6,  avg_cost, avg_shelf_life, avg_ratio)

        # ── Confidence score ─────────────────────────────────────────────────
        confidence_val = demand_vol / max(pred_30d, 1)
        if confidence_val < 0.15:
            confidence = "High"
        elif confidence_val < 0.40:
            confidence = "Medium"
        else:
            confidence = "Low"

        # ── Profit / risk metrics ────────────────────────────────────────────
        margin         = avg_retail - avg_cost
        expected_profit = round(pred_30d * margin, 2)
        risk_margin    = avg_retail - (avg_cost * 1.30)
        theoretical_loss = round(pred_30d * abs(risk_margin), 2) if risk_margin < 0 else 0

        # ── Expiry risk score (0–1): proportion of live stock expiring <30d ──
        upcoming_batches = db_session.query(StockBatch).filter(
            StockBatch.product_id == p.id,
            StockBatch.current_quantity > 0,
            StockBatch.expiry_date.isnot(None)
        ).all()

        total_live_qty = sum(b.current_quantity for b in upcoming_batches) or 1
        expiring_soon_qty = sum(
            b.current_quantity for b in upcoming_batches
            if b.expiry_date and (b.expiry_date.replace(tzinfo=None) - current_date).days < 30
        )
        expiry_risk_score = round(expiring_soon_qty / total_live_qty, 2)

        avg_batch_shelf_life = round(
            np.mean([
                (b.expiry_date - b.manufacture_date).days
                for b in upcoming_batches
                if b.expiry_date and b.manufacture_date
            ]) if upcoming_batches else avg_shelf_life, 1
        )

        # ── Recommendation logic ──────────────────────────────────────────────
        if expiring_soon_qty > 0:
            recommendation = f"URGENT CLEARANCE ({int(expiring_soon_qty)} units expiring)"
        elif risk_margin < 0 and theoretical_loss > expected_profit:
            recommendation = "DO NOT RESTOCK (HIGH RISK)"
        elif margin > 0.5 * avg_cost:
            recommendation = "BUY AND HOLD"
        else:
            recommendation = "BUY CAUTIOUSLY"

        # ── History array for frontend charts ─────────────────────────────────
        history = [
            {
                "label": f"{int(row['month'])}/{int(row['year'])}",
                "demand": int(row['demand_qty']),
                "buy_price": round(float(row['purchase_cost']), 2),
                "retail_price": round(float(row['retail_price']), 2),
            }
            for _, row in monthly.iterrows()
        ]

        insights.append(_sanitize({
            "product_id":            p.id,
            "product_name":          p.product_name,
            "status":                "Active Forecast",
            "outliers_removed":      outliers_count,
            # Predictions
            "predicted_demand":      pred_30d,
            "predicted_demand_30d":  pred_30d,
            "predicted_demand_90d":  pred_90d,
            "predicted_demand_180d": pred_180d,
            # Pricing
            "optimal_buy_price":     round(avg_cost, 2),
            "expected_retail":       round(avg_retail, 2),
            # Financials
            "expected_profit":       expected_profit,
            "theoretical_loss_risk": theoretical_loss,
            # Shelf-life intelligence
            "avg_shelf_life_days":   avg_batch_shelf_life,
            "expiry_risk_score":     expiry_risk_score,
            "demand_volatility":     round(float(demand_vol), 1),
            "confidence":            confidence,
            # UI
            "recommendation":        recommendation,
            "history":               history,
        }))

    _LATEST_INSIGHTS = insights
    _LAST_TRAINED = datetime.now().isoformat()
    return {"status": "success", "insights_generated": len(insights), "timestamp": _LAST_TRAINED}


def get_insights(db_session):
    global _LATEST_INSIGHTS, _LAST_TRAINED
    if not _LATEST_INSIGHTS:
        train_forecaster(db_session)
    return {
        "last_trained": _LAST_TRAINED,
        "insights": _LATEST_INSIGHTS
    }
