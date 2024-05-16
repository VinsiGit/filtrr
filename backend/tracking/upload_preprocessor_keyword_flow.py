import json
from pymongo import MongoClient
from os import environ as e

def upload_data():
    def open_file(file_path):
        with open(file=file_path, mode='r', encoding='utf-8') as f:
            data = json.load(f)
        return data

    def upload_to_database(data, collection_name):
        mongo_host = e.get('MONGO_HOST', 'db')
        mongo_port = int(e.get('MONGO_PORT', '27017'))
        mongo_username = e.get('MONGO_USERNAME', 'root')
        mongo_password = e.get('MONGO_PASSWORD', 'mongo')

        client = MongoClient(host=mongo_host, port=mongo_port, username=mongo_username, password=mongo_password)

        db = client['filtrr_db']
        # Check if the collection already has data
        if db[collection_name].count_documents({}) == 0:
            collection = db[collection_name]
            if isinstance(data, list):
                collection.insert_many(data)
            else:
                collection.insert_one(data)
        else:
            print(f"Data already exists in {collection_name}, no insertion performed.")

    # Read data from files
    train_data = open_file("./data.json")
    keywords = open_file("./keywords.json")
    parameters = open_file("./parameters.json")

    # Upload data to respective collections
    upload_to_database(train_data, collection_name="train_data")
    upload_to_database(keywords, collection_name="keywords")
    upload_to_database(parameters, collection_name="parameters")

# Ensure the function is called to execute the data upload
if __name__ == "__main__":
    upload_data()

