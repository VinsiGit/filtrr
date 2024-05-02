#!/bin/bash

mlflow ui --backend-store-uri sqlite:///mlflow.db&

prefect 

prefect --no-prompt deploy --all&

optuna-dashboard sqlite:///optuna.db&

open_port_in_browser() {
    port=$1
    explorer.exe "http://localhost:$port"
}

echo "Opening ports in web browser..."
open_port_in_browser 4200
open_port_in_browser 5000
open_port_in_browser 8080

wait

echo "All services started"