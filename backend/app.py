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
import random
from preprocessor import Preprocessor
from tracking.retrainlander import preprocess_data_flow


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
mongo_host = e.get('MONGO_HOST', 'host.docker.internal') # 'db' is the default name of the MongoDB service within the Docker network TODO: change to localhost for local development 
mongo_port = int(e.get('MONGO_PORT', '27017'))
mongo_username = e.get('MONGO_USERNAME', 'root')
mongo_password = e.get('MONGO_PASSWORD', 'mongo')

print(mongo_host, mongo_port, mongo_username, mongo_password)



# Create a MongoDB client
client = MongoClient(host=mongo_host, port=mongo_port, username=mongo_username, password=mongo_password)

# Get the MongoDB database
db = client['filtrr_db']

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = e.get('JWT_SECRET_KEY', 'very-secret-key')
CORS(app)
jwt = JWTManager(app)

# Create a list of users
users = [
    {'username': 'admin', 'password_hash': generate_password_hash(e.get('ADMIN_PASSWORD', 'password')), 'role': 'admin'}
]

# Check if any users exist
if db.users.count_documents({}) == 0:
    # No users exist, insert new users
    db.users.insert_many(users)
    print("Users inserted.")
else:
    print("Users already exist in the database.")

# Check if the settings exist
if db.settings.count_documents({}) == 0:
    # No settings exist, insert new settings
    # TODO db.settings.insert_one({'setting': 'value'})
    print("No settings exist in the database.")
else:
    print("Settings already exist in the database.")

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
            access_token = create_access_token(identity={'username': username, 'role': user['role']}, expires_delta=timedelta(hours=168))

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
    rating = request.args.get('rating', type=float, default="all_ratings")
    label = request.args.get('label', default="all_labels")
    source = request.args.get('source', default="all_sources")
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    # Add filters to the query if they are specified
    query = {}
    if rating != "all_ratings":
        query['rating'] = rating
    if label != "all_labels":
        query['label'] = label
    if source != "all_sources":
        query['source'] = source
    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        query['date'] = {"$gte": start_date, "$lte": end_date}

    # Perform the query
    results = db.mails.find(query)

    # Convert the results to a list of dicts
    data = list(results)

    # Exclude the '_id' field from the response
    for item in data:
        item.pop('_id', None)

    
    return jsonify(data), 200


@app.route('/api/stats', methods=['GET'])
@check_role('admin')
def get_data():
    # Extract query parameters
    rating = request.args.get('rating', type=float, default="all_ratings")
    label = request.args.get('label', default="all_labels")
    source = request.args.get('source', default="all_sources")
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
    else:
        first_mail = db.mails.find_one()
        if first_mail:
            start_date = first_mail['date'].replace(hour=0, minute=0, second=0) 
        else:
            start_date = datetime.now().replace(hour=0, minute=0, second=0)
        end_date = datetime.now().replace(hour=23, minute=59, second=59)


    # Add filters to the query if they are specified
    query = {'date' :{"$gte": start_date, "$lte": end_date}}
    if rating != "all_ratings":
        query['rating'] = rating
    if source != "all_sources":
        query['source'] = source

    if label == "all_labels":
    # Query for Unique Labels
        unique_labels_pipeline = [
            {"$match": {"date": {"$gte": start_date, "$lt": end_date}}},
            {"$group": {"_id": None, "labels": {"$addToSet": "$label"}}}
        ]

        unique_labels_result = db.mails.aggregate(unique_labels_pipeline)
        unique_labels = next(unique_labels_result, {}).get('labels', [])
    else:
        unique_labels = [label]

    
    pipeline = [
    {"$match": query},

    # Stage 1: Group by date and label
    {"$group": {
        "_id": {
            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
            "label": "$label"
        },
        "label_count": {"$sum": 1},
        "datetime_elapsed": {"$avg": "$datetime_elapsed"}
    }},

    # Stage 2: Group by date to aggregate all labels together
    {"$group": {
        "_id": "$_id.date",
        "labels_count": {
            "$push": {
                "label": "$_id.label",
                "count": "$label_count"
            }
        },
        "average_processing_time": {"$avg": "$datetime_elapsed"}, 
        "total": {"$sum": "$label_count"},
    }},

    # Optional: Stage 3: Project the final structure if necessary
    {"$project": {
        "date": "$_id",
        "total": 1,
        "labels_count": 1,
        "average_processing_time": 1,
        "_id": 0
    }}
    ]


    # Execute the aggregation query
    count = db.mails.count_documents(query)
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
        for label in unique_labels:
            if not any(d['label'] == label for d in item['labels_count']):
                item['labels_count'].append({"label": label, "count": 0})
        item['labels_count'] = sorted(item['labels_count'], key=lambda x: (x['label'] != "IRRELEVANT", x['label']))

    # Sort the results by date
    json_result = sorted(json_result, key=lambda x: x['date'])

    report = {
        "start_date": start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d'),
        "labels": unique_labels,
        "data": json_result,
        "rating": rating,
        "source": source,
        "total": count
    }


    return jsonify(report), 200

@app.route('/api/certainty', methods=['GET'])
@check_role('admin')
def get_cetainty():
    # Extract query parameters
    source = request.args.get('source', default="all_sources")
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
    else:
        first_mail = db.mails.find_one()
        if first_mail:
            start_date = first_mail['date'] 
        else:
            start_date = datetime.now()
        end_date = datetime.now()


    # Add filters to the query if they are specified
    query = {'date' :{"$gte": start_date, "$lte": end_date}}
    if source != "all_sources":
        query['source'] = source
    
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$label", "average_certainty": {"$avg": "$certainty"}}},
        {"$sort": {"average_certainty": -1}},
        {"$addFields": {"label": "$_id" }},
        {"$project": {"_id": 0} }
    ]

    results = db.mails.aggregate(pipeline)

    # Convert the results to a list of dicts
    json_result = list(results)

    report = {
    "start_date": start_date.strftime('%Y-%m-%d'),
    "end_date": end_date.strftime('%Y-%m-%d'),
    "data": json_result,
    "source": source
    }

    
    return jsonify(report), 200
    


@app.route('/api', methods=['POST'])
@check_role('admin', 'user')
def add_mail():
    if request.content_type != 'application/json':
        return jsonify({"error": "Unsupported Media Type"}), 415

    # Get the data from the request
    data = request.json

    # Get the source from the request headers
    source = request.headers.get('Source')

    # Add the source to the data
    hash = str(hash_input(data['body']))
    existing_record = db.mails.find_one({"id": hash})
    
    if existing_record:
        existing_record.pop('_id', None)
        existing_record['already_exists'] = True
        return jsonify(existing_record), 200
    
    # Preprocess the data
    preprocessor = Preprocessor()

    start_time = time()

    data['text_body'] = data['body']
    preprocessed_data = preprocessor.preprocess(data)
    keywords = preprocessed_data['keywords']

    label = random.choice(['IRRELEVANT', 'BI_ENGINEER', 'DATA_ENGINEER'])
    certainty = random.random()

    end_time = time()
    processing_time = end_time - start_time

    # Make the response in JSON format
    response = {
    "id": hash,
    "label": label,
    "date": datetime.now(),
    "keywords": keywords,
    "rating": 0,
    "datetime_elapsed": processing_time,
    "certainty": certainty,
    "source": source,
   }

    # Add the data to the database
    db.mails.insert_one(response.copy())

    # Remove the 'source' field from the response
    response.pop('source', None)

    return jsonify(response), 200


@app.route('/api/rating', methods=['PUT'])
@check_role('admin', 'user')
def update_rating():
    data = request.json

    # Add the source to the data
    hash = {"id": str(hash_input(data['body']))}
    new_rating = data['rating']

    result = db.mails.update_one(hash, {"$set": {"rating": new_rating}})

    if result.modified_count > 0:
        return "Rating updated successfully."
    else:
        return "No documents matched the query. No update was made."

    
@app.route('/api/settings', methods=['GET'])
@check_role('admin')
def get_settings():
    # TODO: implement settings
    # settings = db.settings.find_one()
    # settings.pop('_id', None)
    return jsonify({"settings": "TODO"}), 200

@app.route('/api/retrain', methods=['POST'])
@check_role('admin')
def retrain():
    mails = preprocess_data_flow(get_mails_from_file=False)
    return mails, 200


@app.route('/api/tokencheck', methods=['GET'])
@jwt_required()
def token_check():
    role = get_jwt_identity()['role']
    return jsonify({"msg": "Token is valid", "role": role}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
