from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pandas as pd
import numpy as np

from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from prophet import Prophet




app = FastAPI()

# ================= CORS =================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= REQUEST MODELS =================


class ForecastRequest(BaseModel):

    values: list
    dates: list

    model: str = "arima"

    future_days: int = 7

    split_ratio: float = 0.8


class ClusterItem(BaseModel):

    name: str
    values: list


class ClusterRequest(BaseModel):

    items: list[ClusterItem]


# ================= METRICS =================


def calculate_metrics(actual, forecast):

    actual = np.array(actual)
    forecast = np.array(forecast)

    actual = np.where(actual == 0, 1, actual)

    mape = np.mean(
        np.abs((actual - forecast) / actual)
    ) * 100

    mae = np.mean(
        np.abs(actual - forecast)
    )

    rmse = np.sqrt(
        np.mean((actual - forecast) ** 2)
    )

    return {

        "mape": round(float(mape), 2),

        "mae": round(float(mae), 2),

        "rmse": round(float(rmse), 2),
    }


# ================= FORECAST API =================


@app.post("/forecast")
def forecast(req: ForecastRequest):

    try:

        series = pd.Series(req.values)

        train_size = int(
            len(series) * float(req.split_ratio)
        )

        train = series[:train_size]

        test = series[train_size:]

        model_name = req.model.lower()

        # ================= ARIMA =================

        if model_name == "arima":

            model = ARIMA(
                train,
                order=(2, 1, 2)
            )

            fit = model.fit()

            pred = fit.forecast(
                steps=len(test)
            )

            future = fit.forecast(
                steps=req.future_days
            )

        # ================= SARIMA =================

        elif model_name == "sarima":

            model = SARIMAX(
                train,
                order=(1, 1, 1),
                seasonal_order=(1, 1, 1, 7)
            )

            fit = model.fit(disp=False)

            pred = fit.forecast(
                steps=len(test)
            )

            future = fit.forecast(
                steps=req.future_days
            )

        # ================= PROPHET =================

        elif model_name == "prophet":

            prophet_df = pd.DataFrame({

                "ds":
                    pd.to_datetime(
                        req.dates[:train_size]
                    ),

                "y":
                    train.values
            })

            prophet_model = Prophet(

                daily_seasonality=True,

                weekly_seasonality=True,

                yearly_seasonality=False
            )

            prophet_model.fit(prophet_df)

            future_df = prophet_model.make_future_dataframe(

                periods=len(test) + req.future_days
            )

            forecast_df = prophet_model.predict(
                future_df
            )

            pred = forecast_df["yhat"].iloc[
                -(len(test) + req.future_days):-req.future_days
            ]

            future = forecast_df["yhat"].iloc[
                -req.future_days:
            ]

        # ================= HOLT =================

        elif model_name == "holt":

            model = ExponentialSmoothing(
                train,
                trend="add",
                seasonal=None
            )

            fit = model.fit()

            pred = fit.forecast(
                len(test)
            )

            future = fit.forecast(
                req.future_days
            )

        else:

            return {
                "error": "Invalid model"
            }

        # ================= METRICS =================

        metrics = calculate_metrics(
            test.values,
            pred.values
        )

        combined = []

        test_dates = req.dates[train_size:]

        # ================= TEST DATA =================

        for i in range(len(test)):

            combined.append({

                "date":
                    test_dates[i],

                "actual":
                    float(test.values[i]),

                "forecast":
                    max(
                        0,
                        round(
                            float(pred.values[i]),
                            2
                        )
                    )
            })

        # ================= FUTURE DATA =================

        last_date = pd.to_datetime(
            req.dates[-1]
        )

        for i in range(req.future_days):

            next_date = (
                last_date
                + pd.Timedelta(days=i + 1)
            )

            combined.append({

                "date":
                    next_date.strftime("%Y-%m-%d"),

                "actual":
                    None,

                "forecast":
                    max(
                        0,
                        round(
                            float(future.values[i]),
                            2
                        )
                    )
            })

        return {

            "data": combined,

            "metrics": metrics
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# ================= CLUSTER API =================



