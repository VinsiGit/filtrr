#!/bin/bash

mlflow ui --backend-store-uri sqlite:///mlflow.db --port 5001 &

python db.py

exec gunicorn --bind 0.0.0.0:5000 app:app