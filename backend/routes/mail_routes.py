from flask import Blueprint, request, jsonify
from db import get_db
from decorators import check_role
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity

mail_routes = Blueprint('mail_routes', __name__)
db = get_db()

@mail_routes.route('/api/mails', methods=['GET'])
@check_role('admin')
def get_mails():
    # Extract query parameters
    rating = request.args.get('rating', type=int, default="all_ratings")
    predicted_label = request.args.get('predicted_label', default="all_labels")
    actual_label = request.args.get('actual_label', default="all_labels")
    model_version = request.args.get('model_version', type=float, default="all_versions")
    source = request.args.get('source', default="all_sources")
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    # Add filters to the query if they are specified
    query = {}
    if rating != "all_ratings":
        query['versions.rating'] = rating
    if predicted_label != "all_labels":
        query['versions.predicted_label'] = predicted_label
    if actual_label != "all_labels":
        query['versions.actual_label'] = actual_label
    if source != "all_sources":
        query['versions.source'] = source
    if model_version != "all_versions":
        query['versions.model_version'] = model_version
    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        query['versions.date'] = {"$gte": start_date, "$lte": end_date}

    pipeline = [
        {"$unwind": "$versions"},
        {"$match": query},
        {"$project": {"_id": 0, "id": 1, "versions": 1}}
    ]
    results = db.mails.aggregate(pipeline)
    data = list(results)
    for item in data:
        item.pop('_id', None)
    return jsonify(data), 200

@mail_routes.route('/api/db', methods=['GET'])
@check_role('admin')
def get_db_entries():
    # Extract query parameters
    rating = request.args.get('rating', type=int, default="all_ratings")
    predicted_label = request.args.get('predicted_label', default="all_labels")
    actual_label = request.args.get('actual_label', default="all_labels")
    model_version = request.args.get('model_version', type=float, default="all_versions")
    source = request.args.get('source', default="all_sources")
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    # Add filters to the query if they are specified
    query = {}
    if rating != "all_ratings":
        query['versions.rating'] = rating
    if predicted_label != "all_labels":
        query['versions.predicted_label'] = predicted_label
    if actual_label != "all_labels":
        query['versions.actual_label'] = actual_label
    if source != "all_sources":
        query['versions.source'] = source
    if model_version != "all_versions":
        query['versions.model_version'] = model_version
    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        query['versions.date'] = {"$gte": start_date, "$lte": end_date}

    db_entries = db.mails.find(query)
    db_entries = list(db_entries)
    for db_entry in db_entries:
        db_entry.pop('_id', None)

    return jsonify(db_entries), 200

@mail_routes.route('/api/tokencheck', methods=['GET'])
@jwt_required()
def token_check():
    role = get_jwt_identity()['role']
    return jsonify({"msg": "Token is valid", "role": role}), 200