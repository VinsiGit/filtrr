from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from datetime import timedelta
from db import get_db

auth_routes = Blueprint('auth_routes', __name__)
db = get_db()

@auth_routes.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    user = db.users.find_one({'username': username})
    if user and check_password_hash(user['password_hash'], password):
        if user['role'] == 'trial':
            access_token = create_access_token(identity={'username': username, 'role': user['role']}, expires_delta=timedelta(minutes=5))
        else:
            access_token = create_access_token(identity={'username': username, 'role': user['role']}, expires_delta=timedelta(days=365))
        return jsonify({"access_token": access_token, "role": user['role']}), 200
    return jsonify({"msg": "Bad username or password"}), 401
