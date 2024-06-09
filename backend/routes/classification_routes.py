from flask import Blueprint, request, jsonify
from db import get_db
from decorators import check_role
from modeloperator import Operator
from time import time
from datetime import datetime
from hashlib import sha256
from db import get_db
from threading import Thread, Lock

classification_routes = Blueprint('classification_routes', __name__)

operator = Operator()
model_version_global = operator.get_model_version().version
retrain_lock = Lock()

db = get_db()

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


@classification_routes.route('/api', methods=['POST'])
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


@classification_routes.route('/api', methods=['PUT'])
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

@classification_routes.route('/api/retrain', methods=['POST'])
@check_role('admin')
def retrain():
    if not retrain_lock.acquire(blocking=False):
        return jsonify({"msg": "A retraining process is already running"}), 400

    def retrain_with_lock():
        try:
            background_retrain()
        finally:
            retrain_lock.release()

    retrain_thread = Thread(target=retrain_with_lock)
    retrain_thread.start()
    return jsonify({"msg": "Retraining started"}), 200

@classification_routes.route('/api/retrain', methods=['PUT'])
@check_role('admin')
def update_model_version():
    global operator
    operator = Operator()
    global model_version_global
    model_version_global = operator.get_model_version().version
    return jsonify({"msg": f"Model version updated to: {model_version_global}"}), 200