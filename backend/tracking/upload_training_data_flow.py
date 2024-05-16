from prefect import task, flow
from prefect.logging import get_logger
from preprocessor import TextPreprocessor
import json
from typing import List, Dict, Tuple

@task()
def load_preprocessor(keyword_file_path: str = 'keywords.json'):
    p = TextPreprocessor()
    p.load_keywords(keyword_file_path=keyword_file_path)
    return p

@task()
def load_train_mails_from_file(train_mails_path: str = 'data.json'):
    with open(file=train_mails_path, mode='r', encoding='utf-8') as f:
        m = json.load(f)
    return m

@task()
def preprocess_train_mails(train_mails: List[Dict]):
    pass

@task()
def upload_mails_to_mongo(preprocessed_train_mails: List[Dict]):
    pass

@flow()
def main_flow():
    pass

