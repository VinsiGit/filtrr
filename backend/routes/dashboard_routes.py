from flask import Blueprint, request, jsonify
from db import get_db
from decorators import check_role
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required


dashboard_routes = Blueprint('dashboard_routes', __name__)
db = get_db()

@dashboard_routes.route('/api/stats', methods=['GET'])
@check_role('admin', 'user')
def get_data():
    # Extract query parameters
    rating = request.args.get('rating', type=int, default="all_ratings")
    predicted_label = request.args.get('predicted_label', default="all_labels")
    actual_label = request.args.get('actual_label', default="all_labels")
    source = request.args.get('source', default="all_sources")
    model_version = request.args.get('model_version', type=float, default="all_versions")
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
    else:
        # Retrieve the first document from the 'mails' collection
        first_mail = db.mails.find_one()
        if first_mail and 'versions' in first_mail and len(first_mail['versions']) > 0:
            first_version_date = first_mail['versions'][0]['date']
            start_date = first_version_date.replace(hour=0, minute=0, second=0)
        else:
            start_date = datetime.now().replace(hour=0, minute=0, second=0)

        end_date = datetime.now().replace(hour=23, minute=59, second=59)

    # Add filters to the query if they are specified
    query = {'versions.date' :{"$gte": start_date, "$lte": end_date}}
    if rating != "all_ratings":
        query['versions.rating'] = rating
    if source != "all_sources":
        query['versions.source'] = source
    if model_version != "all_versions":
        query['versions.model_version'] = model_version
    if predicted_label != "all_labels":
        unique_predicted_labels = [predicted_label]
        query['versions.predicted_label'] = predicted_label
    else:
        unique_predicted_labels = db.mails.distinct("versions.predicted_label")
    if actual_label != "all_labels":
        unique_actual_labels = [actual_label]
        query['versions.actual_label'] = actual_label
    else:
        unique_actual_labels = db.mails.distinct("versions.actual_label")
        if None in unique_actual_labels:
            unique_actual_labels.remove(None)

    pipeline = [
        # Unwind the versions array to treat each version as a document
        {"$unwind": "$versions"},

        {"$match": query},  # Apply the query to filter the documents

        # Group by date and predicted_label
        {"$group": {
            "_id": {
                "date": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$versions.date"
                    }
                },
                "predicted_label": "$versions.predicted_label"
            },
            "label_count": {"$sum": 1},
            "datetime_elapsed": {"$avg": "$versions.datetime_elapsed"},
            "evaluation": {"$sum": "$versions.rating"},
            "certainty": {"$avg": "$versions.certainty"},
            "rating_count": {"$sum": {"$cond": [{ "$ifNull": ["$versions.rating", False] }, 1, 0]}}
        }},

        # Group by date to aggregate all labels together
        {"$group": {
            "_id": "$_id.date",
            "labels_count": {
                "$push": {
                    "label": "$_id.predicted_label",
                    "count": "$label_count",
                    "evaluation": "$evaluation",
                    "rating_count": "$rating_count",
                    "average_confidence": "$certainty",
                    "average_processing_time": "$datetime_elapsed"
                }
            },
            "total": {"$sum": "$label_count"}
        }},

        # Project the final structure
        {"$project": {
            "date": "$_id",
            "total": 1,
            "labels_count": 1,
            "average_processing_time": 1,
            "_id": 0
        }}
    ]

    # Execute the aggregation query
    results = db.mails.aggregate(pipeline)
    
    # Convert the results to a list of dicts
    json_result = list(results)

    # Fill in missing dates with 0 values
    current_date = start_date
    while current_date <= end_date:
        current_date_str = current_date.strftime('%Y-%m-%d')
        if not any(d['date'] == current_date_str for d in json_result):
            json_result.append({"date": current_date_str, "total": 0, "labels_count": []})
        current_date += timedelta(days=1)
    
    # Fill in missing labels with 0 values
    for item in json_result:
        for label in set(unique_predicted_labels + unique_actual_labels):
            if not any(d['label'] == label for d in item['labels_count']):
                item['labels_count'].append({"label": label, "count": 0, "evaluation": 0, "rating_count": 0, "average_confidence": 0, "average_processing_time": 0})
        item['labels_count'] = sorted(item['labels_count'], key=lambda x: (x['label'] != "IRRELEVANT", x['label']))


    # Sort the results by date
    json_result = sorted(json_result, key=lambda x: x['date'])

    report = {
        "start_date": start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d'),
        "predicted_labels": unique_predicted_labels,
        "actual_labels": unique_actual_labels,
        "data": json_result,
        "rating": rating,
        "source": source,
        "model_version": model_version
    }

    return jsonify(report), 200


@dashboard_routes.route('/api/cnfmtrx', methods=['GET'])
@check_role('admin')
def get_cetainty():
    # Extract query parameters
    source = request.args.get('source', default="all_sources")
    model_version = request.args.get('model_version', type=float, default="all_versions")
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
    else:
        # Retrieve the first document from the 'mails' collection
        first_mail = db.mails.find_one()
        if first_mail and 'versions' in first_mail and len(first_mail['versions']) > 0:
            first_version_date = first_mail['versions'][0]['date']
            start_date = first_version_date.replace(hour=0, minute=0, second=0)
        else:
            start_date = datetime.now().replace(hour=0, minute=0, second=0)

        end_date = datetime.now().replace(hour=23, minute=59, second=59)

    # Add filters to the query if they are specified
    query = {'versions.date' :{"$gte": start_date, "$lte": end_date}}
    if source != "all_sources":
        query['versions.source'] = source
    if model_version != "all_versions":
        query['versions.model_version'] = model_version

    pipeline = [
        {"$unwind": "$versions"},
        {"$match": {
            "$and": [
                query,
                {"versions.actual_label": {"$exists": True}}
            ]
        }},
        {"$group": {
            "_id": {
                "predicted_label": "$versions.predicted_label",
                "actual_label": "$versions.actual_label"
            },
            "count": {"$sum": 1}
        }}
    ]

    results = db.mails.aggregate(pipeline)

    # Retrieve distinct labels and ensure 'IRRELEVANT' is first
    labels = db.mails.distinct("versions.predicted_label")
    if 'IRRELEVANT' in labels:
        labels.remove('IRRELEVANT')
    labels = ['IRRELEVANT'] + sorted(labels)  # Prepend 'IRRELEVANT' to the sorted list

    # Initialize matrix and total predictions per label
    matrix = {label: {other_label: 0 for other_label in labels} for label in labels}
    total_predictions = {label: 0 for label in labels}

    # Populate the matrix with counts
    for result in results:
        pred = result['_id']['predicted_label']
        act = result['_id']['actual_label']
        matrix[pred][act] += result['count']
        total_predictions[pred] += result['count']

    # Convert counts to percentages
    confusion_matrix = []
    for pred in labels:
        row = []
        for act in labels:
            if total_predictions[pred] > 0:
                percentage = (matrix[pred][act] / total_predictions[pred]) * 100
                row.append(f"{percentage:.2f}%")
            else:
                row.append("0.00%")
        confusion_matrix.append(row)
    
    report = {
        "start_date": start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d'),
        "source": source,
        "model_version": model_version,
        "labels": labels,
        "confusion_matrix": confusion_matrix
    }

    return jsonify(report), 200

@dashboard_routes.route('/api/stats/labels', methods=['GET'])
@jwt_required()
def get_labels():
    labels = db.mails.distinct('versions.predicted_label')
    return jsonify(list(labels)), 200