import json
from pymongo import MongoClient
from os import environ as e
def upload_test_data():
    def open_file(training_set_file):
        with open(file=training_set_file, mode='r', encoding='utf-8') as f:
            m = json.load(f)
        return m

    def upload_to_database(mail):
        mongo_host = e.get('MONGO_HOST', 'localhost')
        mongo_port = int(e.get('MONGO_PORT', '27017'))
        mongo_username = e.get('MONGO_USERNAME', 'root')
        mongo_password = e.get('MONGO_PASSWORD', 'mongo')

        client = MongoClient(host=mongo_host, port=mongo_port, username=mongo_username, password=mongo_password)

        db = client['filtrr_db']

    open_file()
    upload_to_database()
upload_test_data()