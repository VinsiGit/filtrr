from preprocessor import TextPreprocessor
from sklearn.feature_extraction.text import TfidfVectorizer
import mlflow
from prefect import task, flow
import json
from typing import List, Dict

@flow(name="Load Parameters Flow")
def parameter_flow(parameter_file_path: str = 'parameters.json'):
    @task(name="Read Parameters From File",timeout_seconds=2,retries=3)
    def read_parameters(file_path):
        with open(file=file_path, mode='r', encoding='utf-8') as f:
            return json.load(f)

    @task(name="Extract Model Specific Parameters")
    def extract_params(params):

        tries_p = params.get('tries', 1)
        random_state_p = params.get('random_state', None)
        trn_tst_p = params.get('train_test_split', {'test_size': 0.15})

        vectorizer_p = params.get('tfidf_vectorizer', {})
        adaboost_p = params.get('ada_boost', {"n_estimators": 50, "learning_rate": 1.0})
        bagging_p = params.get('bagging_classifier', {"n_estimators": 125})

        adaboost_p.update({'random_state': random_state_p})
        bagging_p.update({'random_state': random_state_p})

        return tries_p, random_state_p, trn_tst_p, vectorizer_p, adaboost_p, bagging_p

    parameters = read_parameters(parameter_file_path)
    return extract_params(parameters)

@flow(name="Preprocess Data Flow")
def preprocess_flow(mails_file_path: str = 'data.json', keyword_file_path: str = 'keywords.json') -> List[Dict]:
    @task(name="Import Mails",timeout_seconds=2,retries=3)
    def read_mails(mails_file: str) -> List[Dict]:
        with open(file=mails_file, mode='r', encoding='utf-8') as f:
            m = json.load(f)
        return m

    @task(name="Preprocess Mails")
    def preprocess_mails(ms: List[Dict], keyword_file: str) -> List[Dict]:
        preprocessor = TextPreprocessor(keyword_file_path=keyword_file)
        preprocessor.load_keywords()

        mails_preprocessed = []
        for m in ms:
            preprocessed_mail = preprocessor.preprocess(m)
            mails_preprocessed.append(preprocessed_mail)
        return mails_preprocessed

    mails = read_mails(mails_file=mails_file_path)
    preprocessed_mails = preprocess_mails(mails=mails, keyword_file=keyword_file_path)

    return preprocessed_mails

@flow(name='Vectorizer Flow')
def vectorizer_flow(mails,parameters):
    @task()
    def extract_keywords_from_training_data():
        pass

    @task()
    def fit_vectorizer():
