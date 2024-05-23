from flask import Flask , request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from os import environ as e
from hashlib import sha256
from datetime import datetime, timedelta
from time import time
from functools import wraps
from modeloperator import Operator
from threading import Thread


# Function to hash the input
def hash_input(input):
    # Convert the input to bytes
    input_bytes = input.encode('utf-8')

    # Create a hash object
    hash_object = sha256()

    # Update the hash object with the input bytes
    hash_object.update(input_bytes)

    # Get the hashed value as a hexadecimal string
    hashed_input = hash_object.hexdigest()

    return hashed_input


# Get the MongoDB connection details from environment variables
mongo_host = e.get('MONGO_HOST', 'db') 
mongo_port = int(e.get('MONGO_PORT', '27017'))
mongo_username = e.get('MONGO_USERNAME', 'root')
mongo_password = e.get('MONGO_PASSWORD', 'mongo')

print(mongo_host, mongo_port, mongo_username, mongo_password)


# Create a MongoDB client
client = MongoClient(host=mongo_host, port=mongo_port, username=mongo_username, password=mongo_password)

# Get the MongoDB database
db = client['filtrr_db']

# Create a Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = e.get('JWT_SECRET_KEY', 'very-secret-key')
CORS(app)
jwt = JWTManager(app)

operator = Operator()
model_version_global = operator.get_model_version().version

@app.route('/api')
def hello():
    return 'Filtrr api is running!'

@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    user = db.users.find_one({'username': username})
    if user and check_password_hash(user['password_hash'], password):
        # Include the user's role in the JWT
        if user['role'] == 'trial':
            access_token = create_access_token(identity={'username': username, 'role': user['role']}, expires_delta=timedelta(minutes=5))
        else:
            access_token = create_access_token(identity={'username': username, 'role': user['role']}, expires_delta=timedelta(days=365))

        return jsonify({"access_token": access_token, "role": user['role']}), 200
    return jsonify({"msg": "Bad username or password"}), 401

def check_role(*roles):
    def wrapper(fn):
        @wraps(fn) 
        @jwt_required()
        def decorator(*args, **kwargs):
            current_user = get_jwt_identity()
            if current_user['role'] not in roles:
                return jsonify({"msg": "Insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


@app.route('/api/users', methods=['GET'])
@check_role('admin')
def get_users():
    users = db.users.find({}, {'_id': False, 'password_hash': False})
    return jsonify(list(users)), 200


@app.route('/api/users', methods=['POST'])
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


@app.route('/api/users', methods=['PUT'])
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


@app.route('/api/users', methods=['DELETE'])
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


@app.route('/api/mails', methods=['GET'])
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
    # Perform the query
    results = db.mails.aggregate(pipeline)

    # Convert the results to a list of dicts
    data = list(results)

    # Exclude the '_id' field from the response
    for item in data:
        item.pop('_id', None)

    return jsonify(data), 200

@app.route('/api/db', methods=['GET'])
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
    

@app.route('/api/stats', methods=['GET'])
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

@app.route('/api/cnfmtrx', methods=['GET'])
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


@app.route('/api/stats/labels', methods=['GET'])
@jwt_required()
def get_labels():
    labels = db.mails.distinct('versions.predicted_label')
    return jsonify(list(labels)), 200


@app.route('/api', methods=['POST'])
@check_role('admin', 'user')
def add_mail_batch():
    if request.content_type != 'application/json':
        return jsonify({"error": "Unsupported Media Type"}), 415

    responses = []

    model_version = model_version_global
    
    # Get the data from the request
    data_batch = request.json
    if not isinstance(data_batch, list):
        data_batch = [data_batch]

    # Loop through each data entry in the batch
    for data in data_batch:
        try:
            source = request.headers.get('Source')
            hash = str(hash_input(data['body']))
            existing_record = db.mails.find_one({
                "id": hash,
                "versions.model_version": model_version
            }, {"_id": 0, "versions.$": 1})
            
            if existing_record:
                version_info = existing_record['versions'][0]
                response = {
                    "already_exists": True,
                    "predicted_label": version_info["predicted_label"],
                    "date": version_info["date"],
                    "keywords": version_info["keywords"],
                    "datetime_elapsed": version_info["datetime_elapsed"],
                    "certainty": version_info["certainty"],
                    "source": version_info.get("source"),
                    "model_version": version_info["model_version"],
                    "actual_label": version_info.get("actual_label", "N/A"),
                    "rating": version_info.get("rating", "N/A")
                }
                responses.append(response)
                continue

            email = {"body": data['body']}

            start_time = time()
            
            classification = operator.classify(email)
            label = str(classification['predicted_label'][0])
            keywords = classification['keywords']
            certainty = max(classification['certainty'])

            end_time = time()
            processing_time = end_time - start_time

            # Make the response in JSON format
            response = {
                "predicted_label": label,
                "date": datetime.now(),
                "keywords": keywords,
                "datetime_elapsed": processing_time,
                "certainty": certainty,
                "source": source,
                "model_version": model_version
            }
            
            db.mails.update_one(
                {"id": hash},
                {"$push": {"versions": response}},
                upsert=True
            )

            response.pop('source', None)
            responses.append(response)
        except KeyError as e:
            # Log the error, maybe continue with the next item
            responses.append({"error": f"Missing key in data: {str(e)}"})
            continue
        except Exception as e:
            # Handle any other unexpected errors
            responses.append({"error": f"Unexpected error: {str(e)}"})
            continue
    
    if len(responses) == 1:
        return jsonify(responses[0]), 200

    return jsonify(responses), 200


@app.route('/api', methods=['PUT'])
@check_role('admin', 'user')
def update_ratings():
    responses = []

    # Get the data from the request
    data_batch = request.json
    if not isinstance(data_batch, list):
        data_batch = [data_batch]
        
    for entry in data_batch:
        entry_id = str(hash_input(entry['body']))
        rating = int(entry['rating'])
        document = db.mails.find_one({"id": entry_id})

        if document:
            last_index = len(document['versions']) - 1
            update_data = {}

            if rating in [-1, 1]:
                update_data['$set'] = {f'versions.{last_index}.rating': rating}

                if rating == 1:
                    actual_label = document['versions'][last_index]['predicted_label']
                    update_data['$set'][f'versions.{last_index}.actual_label'] = actual_label
                else:
                    if 'actual_label' in entry:
                        if entry['actual_label'] in ['IRRELEVANT', 'BI_ENGINEER', 'DATA_ENGINEER']:
                            actual_label = entry['actual_label']
                            update_data['$set'][f'versions.{last_index}.actual_label'] = actual_label
                        else:
                            responses.append({"status": "failure", "message": "Illegal label", "id": entry['body']})
                            continue

            else:
                responses.append({"status": "failure", "message": "Illegal rating", "id": entry['body']})
                continue

            result = db.mails.update_one({"id": entry_id}, update_data)
            if result.modified_count > 0:
                responses.append({"status": "success", "message": "Rating updated successfully", "id": entry['body']})
            else:
                responses.append({"status": "failure", "message": "No documents matched the query. No update was made.", "id": entry['body']})
        else:
            responses.append({"status": "failure", "message": "Document not found.", "id": entry['body']})

    if len(responses) == 1:
        return jsonify(responses[0]), 200

    return jsonify(responses), 200

def background_retrain():
    operator.train(retrain=True)

@app.route('/api/retrain', methods=['POST'])
@check_role('admin')
def retrain():
    retrain_thread = Thread(target=background_retrain)
    retrain_thread.start()
    return jsonify({"msg": "Retraining started"}), 200

@app.route('/api/retrain', methods=['PUT'])
@check_role('admin')
def update_model_version():
    global operator
    operator = Operator()
    global model_version_global
    model_version_global = operator.get_model_version().version
    return jsonify({"msg": f"Model version updated to: {model_version_global}"}), 200

@app.route('/api/tokencheck', methods=['GET'])
@jwt_required()
def token_check():
    role = get_jwt_identity()['role']
    return jsonify({"msg": "Token is valid", "role": role}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
