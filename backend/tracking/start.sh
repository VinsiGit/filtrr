#!/bin/bash

start_services() {
    prefect init --recipe local && \

    prefect worker start -t process -p main_pool &
    WORKER_PID=$!

    prefect --no-prompt deploy train_model_flow.py:main_flow -n 'train_model' -p main_pool

    prefect server start --no-ui &
    SERVER_PID=$!

    mlflow ui --backend-store-uri sqlite:///mlflow.db &
    MLFLOW_PID=$!

    optuna-dashboard sqlite:///optuna.db &
    OPTUNA_PID=$!

    echo "All services started"

    prefect deployment run Main/train_model

    wait $SERVER_PID $WORKER_PID $MLFLOW_PID $OPTUNA_PID
}

trap 'echo "Stopping services..."; pkill -P $$; exit 1' SIGINT

start_services