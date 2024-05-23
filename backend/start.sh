#!/bin/sh

# Run the database initialization script
python db.py


python train_model_flow.py

mlflow ui --backend-store-uri sqlite:///mlflow.db --port 8070&

optuna-dashboard sqlite:///optuna.db


# Run the application using Gunicorn
exec gunicorn --bind 0.0.0.0:5000 app:app