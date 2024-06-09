from mlflow import MlflowClient
from prefect import task, flow
from prefect.logging import get_logger
from preprocessor import TextPreprocessor
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from typing import List, Dict, Tuple
import datetime
import json
import mlflow
import optuna
from pymongo import MongoClient
from os import environ as e
from db import get_db

db = get_db()

@flow(name="Load Parameters Flow", description="Load parameters from a JSON \
file and extract model-specific parameters.")
def load_parameters_flow(parameter_file_path: str = 'tracking/parameters.json', retrain:bool = False) -> tuple:
    """
    Flow to load parameters from a JSON file and extract model-specific parameters.

    Parameters:
        parameter_file_path (str): Path to the parameter JSON file.

    Returns:
        tuple: Tuple containing train-test split parameters, vectorizer parameters,
               AdaBoost parameters, and Bagging parameters.
    """
    #____________________________________________________________________________________
    @task(name="Read Parameters From File", description="Read parameters from a JSON file.")
    def read_parameters(file_path: str) -> dict:
        log = get_logger()
        try:
            with open(file=file_path, mode='r', encoding='utf-8') as f:
                j = json.load(f)
                return j
        except FileNotFoundError:
            log.info(f"Error: File '{file_path}' not found.")
            return {}
    # ____________________________________________________________________________________

    @task(name="Read Parameters From db", description="Read parameters from a MongoDB collection.")
    def read_parameters_from_db(collection_name: str) -> dict:
        log = get_logger()
        try:
            hyperparameters = db.hyperparameters.find_one()
            hyperparameters.pop('_id', None)
            return hyperparameters
        except Exception as e:
            log.info(f"Error: {e}")
            return {}

    @task(name="Extract Model Specific Parameters", description="Extract model-specific parameters from loaded parameters.")
    def extract_params(params: dict) -> tuple:
        random_state_p = params.get('random_state', None)
        trn_tst_p = params.get('train_test_split', {'test_size': 0.15})

        vectorizer_p = params.get('tfidf_vectorizer', {})
        adaboost_p = params.get('ada_boost', {'n_estimators': 38, 'learning_rate': 0.02})
        tree_p = params.get('decision_tree', {'splitter': 'best', 'max_depth': 4, 'criterion': 'gini'})
        # 90,9% acc - 93,6% pre - 93,9% rec

        adaboost_p.update({'random_state': random_state_p})
        tree_p.update({'random_state': random_state_p})

        return trn_tst_p, vectorizer_p, adaboost_p, tree_p

    if retrain:
        parameters = read_parameters_from_db('hyperparameters')
    else:
        parameters = read_parameters(parameter_file_path)
    return extract_params(parameters)


@flow(name="Preprocess Data Flow", description="Read and preprocess mails from JSON files.")
def preprocessor_flow(mails_file_path: str = 'tracking/data.json', keyword_file_path: str = 'tracking/keywords.json', retrain:bool=False) -> tuple:
    """
    Flow to read and preprocess mails from JSON files.

    Parameters:
        mails_file_path (str): Path to the JSON file containing mails data.
        keyword_file_path (str): Path to the JSON file containing keywords data.
        get_mails_from_file (bool): A bool to specify where the data source is located T: data.json, F: mongodb


    Returns:
        tuple: Tuple containing preprocessed mails and text preprocessor instance.
    """
    # ____________________________________________________________________________________
    @task(name="Import Mails From 'data.json'", description="Read mails data from JSON file.")
    def read_mails_from_file(mails_file: str) -> List[Dict]:
        with open(file=mails_file, mode='r', encoding='utf-8') as f:
            m = json.load(f)
        return m
    # ____________________________________________________________________________________

    @task(name="Read mails from MongoDB", description="Read mails data from MongoDB.")
    def read_mails_from_db() -> List[Dict]:
        # Get the MongoDB collection
        collection = db['mails']

        pipeline = [
            {"$unwind": "$versions"},
            {"$match": {"versions.actual_label": {"$exists": True}}},
            {"$sort": {"versions.model_version": -1}},
            {"$group": {
                "_id": "$id",  
                "document": {"$first": "$$ROOT"}  
            }},
            {"$replaceRoot": {"newRoot": "$document"}},
            {"$project": {"label": "$versions.actual_label",
                          "keywords": "$versions.keywords"
            }}
        ]

        result = collection.aggregate(pipeline)

        # Get all the mails from the collection
        mails = list(result)

        collection2 = db['train_data']
        train_data = list(collection2.find())
        
        for mail in train_data:
            mail.pop('_id', None)

        for mail in mails:
            mail.pop('_id', None)
        
        mails.extend(train_data)
        return mails
    
    @task(name="Preprocess Mails", description="Preprocess mails using text preprocessor.")
    def preprocess_mails(data: List[Dict], keyword_file: str) -> tuple:
        p = TextPreprocessor(retrain=retrain)
        p.load_keywords(keyword_file_path=keyword_file)

        mails_preprocessed = []
        for m in data:
            preprocessed_mail = p.preprocess(m)
            mails_preprocessed.append(preprocessed_mail)
        return mails_preprocessed, p

    if retrain:
        mails = read_mails_from_db()
    else:
        mails = read_mails_from_file(mails_file=mails_file_path)

    preprocessed_mails, preprocessor = preprocess_mails(data=mails, keyword_file=keyword_file_path)

    return preprocessed_mails, preprocessor


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
    keywords = get_all_keywords(data=mails)
    keywords_p_mail, label_p_mail = prepare_train_data(data=mails)
    return keywords, keywords_p_mail, label_p_mail


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
def train_model_flow(x: list, y: list, train_test_parameters: dict, adaboost_parameters: dict, tree_parameters: dict,
                    vectorizer: TfidfVectorizer, preprocessor: TextPreprocessor) -> None:
    """
    Flow to train model using AdaBoost and Bagging classifiers with MLflow logging.

    Parameters:
        x (list): list of keywords per mail
        y (list): list of labels per mail
        train_test_parameters (dict): Parameters for train-test split.
        adaboost_parameters (dict): Parameters for AdaBoost classifier.
        vectorizer (TfidfVectorizer): Trained TF-IDF vectorizer.
        preprocessor (TextPreprocessor): Text preprocessor instance.
    """
    @task(name="Split Data", description="Split data into training and testing sets.")
    def split_data(x: List[List[str]], y: List[str], trn_tst_params: dict, vect: TfidfVectorizer) -> tuple:
        transformed_x = []
        for keywords_mail in x:
            mail_text = ' '.join(keywords_mail)
            transformed_x.append(mail_text)
        sparse_m = vect.transform(transformed_x)
        x_trn, x_tst, y_trn, y_tst = train_test_split(sparse_m, y, **trn_tst_params)
        return x_trn, x_tst, y_trn, y_tst

    @task(name="Get Best Classifier", description="Uses optuna to get the best set of hyperparams to train the model")
    def get_best_classifier(x_trn, x_tst, y_trn, y_tst, a_params, t_params) -> Tuple[AdaBoostClassifier, Dict,
    float, float, Dict, float, float, float]:

        def objective1(trial):
            t_pms = {}
            for key, value in t_params.items():
                if not isinstance(value, list):
                    t_pms[key] = value
                elif isinstance(value[0], (bool, str)):
                    t_pms[key] = trial.suggest_categorical(name=str(key), choices=value)
                elif isinstance(value[0], int):
                    t_pms[key] = trial.suggest_int(name=str(key), low=value[0], high=value[1])
                else:
                    t_pms[key] = trial.suggest_float(name=str(key), low=value[0], high=value[1], step=value[2])

            tree = DecisionTreeClassifier(**t_pms)
            tree.fit(x_trn, y_trn)
            y_pred = tree.predict(x_tst)
            accuracy = accuracy_score(y_tst, y_pred)
            precision = precision_score(y_tst, y_pred, average='macro', zero_division=0)
            return accuracy, precision

        storage = "sqlite:///optuna.db"

        pruner = optuna.pruners.MedianPruner(n_startup_trials=40)
        sampler = optuna.samplers.TPESampler()

        current_datetime = datetime.datetime.now()
        formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S.%f")

        study1 = optuna.create_study(study_name=f"Tree Optimization - {formatted_datetime} - Step 1",
                                    directions=['maximize','maximize'],
                                    sampler=sampler, pruner=pruner, storage=storage)
        study1.optimize(objective1, n_trials=50)

        trial1 = study1.best_trials.pop()
        params1 = trial1.params
        tree = DecisionTreeClassifier(**params1)
        a_params.update({"estimator":tree})
        acc1 = trial1.values[0]
        pre1 = trial1.values[1]

        def objective2(trial):
            a_pms = {}
            for key, value in a_params.items():
                if not isinstance(value, list):
                    a_pms[key] = value
                elif isinstance(value[0], (bool, str)):
                    a_pms[key] = trial.suggest_categorical(name=str(key), choices=value)
                elif isinstance(value[0], int):
                    a_pms[key] = trial.suggest_int(name=str(key), low=value[0], high=value[1])
                else:
                    a_pms[key] = trial.suggest_float(name=str(key), low=value[0], high=value[1], step=value[2])

            model = AdaBoostClassifier(**a_pms)
            model.fit(x_trn, y_trn)

            y_pred = model.predict(x_tst)

            accuracy = accuracy_score(y_tst, y_pred)
            precision = precision_score(y_tst, y_pred, average='macro', zero_division=0)
            recall = recall_score(y_tst,y_pred, average='macro', zero_division=0)
            return accuracy, precision, recall

        study2 = optuna.create_study(study_name=f"Model Optimization - {formatted_datetime} - Step 2",
                                    directions=['maximize','maximize','maximize'],
                                    sampler=sampler, pruner=pruner, storage=storage)
        study2.optimize(objective2, n_trials=150)

        trial2 = study2.best_trials.pop()
        params2 = trial2.params
        acc2 = trial2.values[0]
        pre2 = trial2.values[1]
        rec2 = trial2.values[2]

        clf = AdaBoostClassifier(**params2, estimator=tree)
        clf.fit(x_trn, y_trn)
        return clf, params1, acc1, pre1, params2, acc2, pre2, rec2

    sqlite_uri = "sqlite:///mlflow.db"
    experiment_name = "FiltrrModelTracking"

    mlflow.set_tracking_uri(sqlite_uri)
    client = MlflowClient(tracking_uri=sqlite_uri)
    if experiment_name not in [exp.name for exp in client.search_experiments()]:
        mlflow.create_experiment(experiment_name)
    mlflow.set_experiment(experiment_name)

    with (mlflow.start_run()):
        mlflow.set_tag("developer", "red panda 🕊️")

        x_train, x_test, y_train, y_test = split_data(x,y, train_test_parameters, vectorizer) # use x and y here

        trained_classifier, parameters1, accuracy1, precision1, parameters2, accuracy2, precision2, recall2 = (
        get_best_classifier(x_train, x_test, y_train, y_test, adaboost_parameters, tree_parameters))

        mlflow.log_params(train_test_parameters)

        mlflow.sklearn.log_model(vectorizer, "vectorizer")
        mlflow.sklearn.log_model(preprocessor, "preprocessor")
        mlflow.sklearn.log_model(trained_classifier, "model")

        vectorizer_uri = f"runs:/{mlflow.active_run().info.run_id}/vectorizer"
        preprocessor_uri = f"runs:/{mlflow.active_run().info.run_id}/preprocessor"
        adaboost_uri = f"runs:/{mlflow.active_run().info.run_id}/model"

        mlflow.register_model(vectorizer_uri, "Vect")
        mlflow.register_model(preprocessor_uri, "Prep")
        mlflow.register_model(adaboost_uri, "Model")

        mlflow.log_params({"TREE - Test Parameters": tree_parameters})
        mlflow.log_params({"TREE - Best Parameters": parameters1})
        mlflow.log_params({"TREE - Accuracy": accuracy1})
        mlflow.log_params({"TREE - Precision": precision1})

        mlflow.log_params({"MODEL - Test Parameters": adaboost_parameters})
        mlflow.log_params({"MODEL - Accuracy": accuracy2})
        mlflow.log_params({"MODEL - Best Parameters": parameters2})
        mlflow.log_params({"MODEL - Precision": precision2})
        mlflow.log_params({"MODEL - Recall": recall2})

        latest_model_version = mlflow.tracking.MlflowClient().get_latest_versions("Model",
                                                                                  stages=['None'])
        latest_version_number = latest_model_version[0].version if latest_model_version else None

        client.set_registered_model_alias("Model", "Production", latest_version_number)
        client.set_registered_model_alias("Vect", "Production", latest_version_number)
        client.set_registered_model_alias("Prep", "Production", latest_version_number)


@flow(name="Main", description="Main flow that runs all other flows for the full train cycle of a model")
def main_flow(retrain = False):
    """
    Main flow for training an AdaBoost classifier on email data.

    This flow loads parameters, preprocesses data, prepares training data,
    trains a TF-IDF vectorizer, and trains an AdaBoost classifier.
    """
    if retrain:
        trn_tst_parameters, vectorizer_parameters, adaboost_parameters, tree_parameters = load_parameters_flow(retrain=True)

        preprocessed_mails, preprocessor = preprocessor_flow(retrain=True)

    else:
        trn_tst_parameters, vectorizer_parameters, adaboost_parameters, tree_parameters = load_parameters_flow()

        preprocessed_mails, preprocessor = preprocessor_flow()
    
    keywords, keywords_per_mail, label_per_mail = prepare_training_data_flow(preprocessed_mails)

    vectorizer = train_vectorizer_flow(keywords, vectorizer_parameters)
    train_model_flow(keywords_per_mail, label_per_mail, trn_tst_parameters,
                    adaboost_parameters, tree_parameters, vectorizer, preprocessor)

if __name__ == '__main__':
    main_flow(retrain=False)