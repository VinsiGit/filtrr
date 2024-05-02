from prefect import task, flow
from tracking.preprocessor import TextPreprocessor
from sklearn.ensemble import AdaBoostClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from typing import List, Dict
import json
import mlflow
import optuna
from pymongo import MongoClient
from os import environ as e

@flow(name="Load Parameters Flow", description="Load parameters from a JSON file and extract model-specific parameters.")
def load_parameters_flow(parameter_file_path: str = 'parameters.json') -> tuple:
    """
    Flow to load parameters from a JSON file and extract model-specific parameters.

    Parameters:
        parameter_file_path (str): Path to the parameter JSON file.

    Returns:
        tuple: Tuple containing train-test split parameters, vectorizer parameters,
               AdaBoost parameters, and Bagging parameters.
    """
    @task(name="Read Parameters From File", description="Read parameters from a JSON file.")
    def read_parameters(file_path: str) -> dict:
        with open(file=file_path, mode='r', encoding='utf-8') as f:
            return json.load(f)

    @task(name="Extract Model Specific Parameters", description="Extract model-specific parameters from loaded parameters.")
    def extract_params(params: dict) -> tuple:
        random_state_p = params.get('random_state', None)
        trn_tst_p = params.get('train_test_split', {'test_size': 0.15})

        vectorizer_p = params.get('tfidf_vectorizer', {})
        adaboost_p = params.get('ada_boost', {"n_estimators": 2, "learning_rate": 1.0})

        adaboost_p.update({'random_state': random_state_p})

        return trn_tst_p, vectorizer_p, adaboost_p

    parameters = read_parameters(parameter_file_path)
    return extract_params(parameters)


@flow(name="Preprocess Data Flow", description="Read and preprocess mails from JSON files.")
def preprocess_data_flow(mails_file_path: str = 'data.json', keyword_file_path: str = 'keywords.json', get_mails_from_file:bool=True) -> tuple:
    """
    Flow to read and preprocess mails from JSON files.

    Parameters:
        mails_file_path (str): Path to the JSON file containing mails data.
        keyword_file_path (str): Path to the JSON file containing keywords data.
        get_mails_from_file (bool): A bool to specify where the data source is located T: data.json, F: mongodb


    Returns:
        tuple: Tuple containing preprocessed mails and text preprocessor instance.
    """
    @task(name="Import Mails From 'data.json'", description="Read mails data from JSON file.")
    def read_mails_from_file(mails_file: str) -> List[Dict]:
        with open(file=mails_file, mode='r', encoding='utf-8') as f:
            m = json.load(f)
        return m

    # TODO: LANDER POWER PLEASE PUT ZE MONGODB CONNECTION HERE TO ASK ZE DATA FROM ZE DATABASE JAWOL
    # def read_mails_from_database() -> List[Dict]:

    @task(name="Import Mails From Mongodb", description="Read mails data from MongoDB.")
    def read_mails_from_database() -> List[Dict]:
        # Get the MongoDB connection details from environment variables
        mongo_host = e.get('MONGO_HOST', 'db')
        mongo_port = int(e.get('MONGO_PORT', '27017'))
        mongo_username = e.get('MONGO_USERNAME', 'root')
        mongo_password = e.get('MONGO_PASSWORD', 'mongo')

        # Connect to the MongoDB server
        client = MongoClient(host=mongo_host, port=mongo_port, username=mongo_username, password=mongo_password)
        
        # Get the MongoDB database
        db = client['filtrr_db']

        # Get the MongoDB collection
        collection = db['mails']

        # Get all the mails from the collection
        mails = list(collection.find({"rating": 1}))

        # Close the MongoDB connection
        client.close()
        
        # remove the _id field from the mails
        for mail in mails:
            mail.pop('_id')

        return mails
    

    @task(name="Preprocess Mails", description="Preprocess mails using text preprocessor.")
    def preprocess_mails(data: List[Dict], keyword_file: str) -> tuple:
        p = TextPreprocessor()
        p.load_keywords(keyword_file_path=keyword_file)

        mails_preprocessed = []
        for m in data:
            preprocessed_mail = p.preprocess(m)
            mails_preprocessed.append(preprocessed_mail)
        return mails_preprocessed, p

    mails = None
    if get_mails_from_file:
        mails = read_mails_from_file(mails_file=mails_file_path)
    else:
        mails = read_mails_from_database()

    # preprocessed_mails, preprocessor = preprocess_mails(data=mails, keyword_file=keyword_file_path)

    # return preprocessed_mails, preprocessor

    return mails


@flow(name='Prepare Data For Model Training', description="Prepare data for training the model.")
def prepare_training_data_flow(mails: List[Dict]) -> tuple:
    """
    Flow to prepare data for training the model.

    Parameters:
        mails (List[Dict]): List of mails data.

    Returns:
        tuple: Tuple containing all keywords and prepared training data.
    """
    @task(name="Get All Keywords", description="Extract all keywords from mails data.")
    def get_all_keywords(data: List[Dict]) -> List[str]:
        keywords = [keyword for mail in data for keyword in mail['keywords']]
        return keywords

    @task(name="Prepare Training Data", description="Prepare training data with keywords and labels.")
    def prepare_train_data(data: List[Dict]) -> tuple:
        keywords_per_mail = []
        label_per_mail = []
        for mail in data:
            keywords_per_mail.append(mail['keywords'])
            label_per_mail.append(mail['label'])
        return keywords_per_mail, label_per_mail

    return get_all_keywords(data=mails), prepare_train_data(data=mails)


@flow(name="Train Vectorizer Flow", description="Train TF-IDF vectorizer for text data.")
def train_vectorizer_flow(keywords: List[str], vectorizer_parameters: dict) -> TfidfVectorizer:
    """
    Flow to train TF-IDF vectorizer for text data.

    Parameters:
        keywords (List[str]): List of keywords.
        vectorizer_parameters (dict): Parameters for TF-IDF vectorizer.

    Returns:
        TfidfVectorizer: Trained TF-IDF vectorizer.
    """
    @task(name="Assign Parameters to Vectorizer", description="Assign parameters to TF-IDF vectorizer.")
    def assign_parameters(v_params: dict) -> TfidfVectorizer:
        v = TfidfVectorizer(**v_params)
        return v

    @task(name="Train Vectorizer", description="Train TF-IDF vectorizer with keywords data.")
    def train_vectorizer(data: List[str], v: TfidfVectorizer) -> TfidfVectorizer:
        v.fit(data)
        return v

    vectorizer = assign_parameters(v_params=vectorizer_parameters)
    return train_vectorizer(data=keywords, v=vectorizer)


@flow(name="Train Model With MLflow", description="Train model using AdaBoost and Bagging classifiers with MLflow logging.")
def train_model_flow(mails: List[Dict], train_test_parameters: dict, adaboost_parameters: dict,
                    vectorizer: TfidfVectorizer, preprocessor: TextPreprocessor) -> None:
    """
    Flow to train model using AdaBoost and Bagging classifiers with MLflow logging.

    Parameters:
        mails (List[Dict]): List of mails data.
        train_test_parameters (dict): Parameters for train-test split.
        adaboost_parameters (dict): Parameters for AdaBoost classifier.
        vectorizer (TfidfVectorizer): Trained TF-IDF vectorizer.
        preprocessor (TextPreprocessor): Text preprocessor instance.
    """
    @task(name="Split Data", description="Split data into training and testing sets.")
    def split_data(x: List[str], y: List[str], trn_tst_params: dict, vect: TfidfVectorizer) -> tuple:
        x = vect.transform(x)
        x_trn, x_tst, y_trn, y_tst = train_test_split(x, y, **trn_tst_params)
        return x_trn, x_tst, y_trn, y_tst

    @task(name="Assign Parameters to Classifier", description="Assign parameters to AdaBoost and Bagging classifiers.")
    def assign_parameters(a_params: dict) -> AdaBoostClassifier:
        clf = AdaBoostClassifier(**a_params)
        return clf

    @task(name="Train Classifier", description="Train the classifier using training data.")
    def train_classifier(x_trn, y_trn, clf) -> AdaBoostClassifier:
        clf.fit(x_trn, y_trn)
        return clf

    @task(name="Test Classifier", description="Test the trained classifier on test data.")
    def test_classifier(x_tst, y_tst, clf) -> float:
        y_pred = clf.predict(x_tst)
        acc = accuracy_score(y_tst, y_pred)
        return acc

    with mlflow.start_run():
        mlflow.log_params(train_test_parameters)
        mlflow.log_params(adaboost_parameters)

        mlflow.sklearn.log_model(vectorizer, "vectorizer")
        mlflow.sklearn.log_model(preprocessor, "preprocessor")

        x_train, x_test, y_train, y_test = split_data(mails, train_test_parameters['test_size'], vectorizer)

        classifier = assign_parameters(adaboost_parameters)

        trained_classifier = train_classifier(x_train, y_train, classifier)

        test_accuracy = test_classifier(x_test, y_test, trained_classifier)

        mlflow.sklearn.log_model(trained_classifier, "trained_model")
        mlflow.log_metric("test_accuracy", test_accuracy)

        #TODO: get these models in a database
        #TODO: solve run id issue (via global param probs??)
        #TODO: test code
        #TODO: fix bugs
        #TODO: create main flow
        #TODO: ask prof about mlflow related stuff
        #TODO: add error handeling
        #TODO: do the optuna stuffs