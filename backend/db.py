import json
from pymongo import MongoClient
from os import environ as e
from werkzeug.security import generate_password_hash

# Create a list of users
users = [
    {'username': e.get('ADMIN_USERNAME', 'admin'), 'password_hash': generate_password_hash(e.get('ADMIN_PASSWORD', 'password')), 'role': 'admin'}
]

def create_collection(db, collection_name):
    if collection_name not in db.list_collection_names():
        db.create_collection(collection_name)
        print(f"{collection_name} collection created.")
    else:
        print(f"{collection_name} collection already exists.")

def create_index(collection, index_name):
    if index_name == "id":
        collection.create_index(index_name, unique=True)
    else:
        collection.create_index(index_name)

def insert_data(collection, data):
    if collection.count_documents({}) == 0:
        if isinstance(data, list):
            collection.insert_many(data)
        else:
            collection.insert_one(data)
        print(f"Data inserted into {collection.name}.")
    else:
        print(f"Data already exists in {collection.name}, no insertion performed.")

def insert_data_from_file(collection, file_path):
    if collection.count_documents({}) == 0:
        with open(file=file_path, mode='r', encoding='utf-8') as f:
            data = json.load(f)
        insert_data(collection, data)
    else:
        print(f"Data already exists in {collection.name}, no insertion performed.")


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

create_collection(db, 'mails')
create_collection(db, 'users')
create_collection(db, 'train_data')
create_collection(db, 'keywords')
create_collection(db, 'hyperparameters')

insert_data(db.users, users)
insert_data_from_file(db.train_data, 'tracking/data.json')
insert_data_from_file(db.keywords, 'tracking/keywords.json')
insert_data_from_file(db.hyperparameters, 'tracking/parameters.json')

create_index(db.mails, 'id')
create_index(db.mails, 'versions.model_version')
create_index(db.mails, 'versions.predicted_label')
create_index(db.mails, 'versions.actual_label')
create_index(db.mails, 'versions.rating')
create_index(db.mails, 'versions.source')
create_index(db.mails, 'versions.date')

client.close()