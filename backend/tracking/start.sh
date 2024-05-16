#!/bin/bash

open_port_in_browser() {
    port=$1
    explorer.exe "http://localhost:$port"
}

start_services() {
    prefect init --recipe local && \
    prefect --no-prompt deploy  train_model_flow.py:main_flow -n 'filtrr_retrain' -p main_pool && \
    prefect worker start -t process -p main_pool &
    prefect server start --port 4200 --host localhost &
    mlflow ui --backend-store-uri sqlite:///mlflow.db --port 5000 --host localhost &
    optuna-dashboard sqlite:///optuna.db --port 8080 --host localhost

    echo "Opening ports in web browser..."
    open_port_in_browser 4200
    open_port_in_browser 5000
    open_port_in_browser 8080

    echo "All services started"

    wait
}

trap 'echo "Stopping services..."; pkill -P $$; exit 1' SIGINT

start_services

