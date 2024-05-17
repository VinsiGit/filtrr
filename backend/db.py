from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from os import environ as e
import json

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