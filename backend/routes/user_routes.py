from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db import get_db
from decorators import check_role

user_routes = Blueprint('user_routes', __name__)
db = get_db()

@user_routes.route('/api/users', methods=['GET'])
@check_role('admin')
def get_users():
    users = db.users.find({}, {'_id': False, 'password_hash': False})
    return jsonify(list(users)), 200

@user_routes.route('/api/users', methods=['POST'])
@check_role('admin')
def add_user():
    username = request.json.get('username')
    password = request.json.get('password')
    role = request.json.get('role')
    if not username or not password or not role:
        return jsonify({"msg": "Username, password and role are required"}), 400
    if db.users.find_one({'username': username}):
        return jsonify({"msg": "Username already exists"}), 400
    db.users.insert_one({'username': username, 'password_hash': generate_password_hash(password), 'role': role})
    return jsonify({"msg": "User added successfully"}), 200

@user_routes.route('/api/users', methods=['PUT'])
@check_role('admin')
def update_user():
    username = request.json.get('username')
    new_password = request.json.get('password')
    new_role = request.json.get('role')
    if not username:
        return jsonify({"msg": "Username is required"}), 400
    update = {}
    if new_password:
        update['password_hash'] = generate_password_hash(new_password)
    if new_role:
        update['role'] = new_role
    if not update:
        return jsonify({"msg": "Password or role is required"}), 400
    result = db.users.update_one({'username': username}, {"$set": update})
    if result.modified_count > 0:
        return jsonify({"msg": "User updated successfully"}), 200
    return jsonify({"msg": "User not found"}), 404

@user_routes.route('/api/users', methods=['DELETE'])
@check_role('admin')
def delete_user():
    username = request.json.get('username')
    if not username:
        return jsonify({"msg": "Username is required"}), 400
    if username == 'admin':
        return jsonify({"msg": "Cannot delete admin user"}), 400
    result = db.users.delete_one({'username': username})
    if result.deleted_count > 0:
        return jsonify({"msg": "User deleted successfully"}), 200
    return jsonify({"msg": "User not found"}), 404
