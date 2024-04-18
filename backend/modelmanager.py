import os
import time
import numpy as np

from typing import List, Tuple, Dict, Any, Union

from sklearn.ensemble import BaggingClassifier, AdaBoostClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
import joblib

from preprocessor import Preprocessor
from vectorizermanager import VectorizerManager


class ModelManager:
    """Class to train a model using AdaBoost and BaggingClassifier."""

    def __init__(self, test_size: float = 0.15, random_state: int = 42,
                 learning_rate: float = 1, base_n_estimators: int = 50,
                 n_estimators: int = 125, vectorizer_file: str = 'models/tfidf_vectorizer.joblib'):
        """
        Initialize the ModelTrainer.

        Parameters:
        - test_size: float, optional (default=0.15)
            The proportion of the dataset to include in the test split.
        - random_state: int, optional (default=42)
            Controls the randomness of the training and testing splits.
        - learning_rate: float, optional (default=1)
            Learning rate of the AdaBoost classifier.
        - base_n_estimators: int, optional (default=50)
            Number of base estimators in the AdaBoost classifier.
        - n_estimators: int, optional (default=125)
            Number of estimators in the BaggingClassifier.
        - vectorizer_file: str, optional (default='models/tfidf_vectorizer.joblib')
            File path to save/load the TF-IDF vectorizer.

        """
        self.models_dir = 'models'
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)

        self.__class_mapping: Dict[str, int] = {'BI_ENGINEER': 0, 'DATA_ENGINEER': 1, 'IRRELEVANT': 2}
        self.__reverse_class_mapping: Dict[int, str] = {0: 'BI_ENGINEER', 1: 'DATA_ENGINEER', 2: 'IRRELEVANT'}

        self.__test_size: float = test_size
        self.__random_state: int = random_state
        self.__learning_rate: float = learning_rate
        self.__base_n_estimators: int = base_n_estimators
        self.__n_estimators: int = n_estimators

        self.__preprocessor: Preprocessor = Preprocessor()
        self.vectorizer_manager = VectorizerManager(vectorizer_file)
        self.vectorizer = self.vectorizer_manager.load_vectorizer()

    def load_model(self) -> Union[BaggingClassifier, None]:
        """
        Load the trained model if it exists, otherwise return None.

        Returns:
        - Union[BaggingClassifier, None]
            Trained bagged AdaBoost classifier if found, else None.
        """
        model_path = os.path.join(self.models_dir, 'adaboost_model.joblib')
        if os.path.exists(model_path):
            return joblib.load(model_path)
        else:
            print("Model not found. You need to train the model first.")
            return None

    def train_model(self, data: List[str]) -> Dict[str, Any]:
        """
        Train the model, save it, and calculate metrics.

        Parameters:
        - data: List[str]
            List of textual data for training.

        Returns:
        - metrics: Dict[str, Any]
            Dictionary containing metrics including start and end time of training,
            elapsed training time, accuracy per label, and global accuracy.

        """
        start_time: float = time.time()

        x, y = self.__prepare_data_for_training(data)
        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=self.__test_size,
                                                            random_state=self.__random_state)
        model = self.__fit_model(x_train, y_train)

        elapsed_time: float = time.time() - start_time

        joblib.dump(model, os.path.join(self.models_dir, 'adaboost_model.joblib'))  # Save the trained model

        metrics: Dict[str, Any] = self.__calculate_metrics(y_test, model.predict(x_test), elapsed_time)
        return metrics

    def __prepare_data_for_training(self, data: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess the data and transform it into features.

        Parameters:
        - data: List[str]
            List of textual data for preprocessing.

        Returns:
        - Tuple[np.ndarray, np.ndarray]
            Tuple containing feature vectors (x) and labels (y).

        """
        x = []
        y = []
        for item in data:
            preprocessed_mail = self.__preprocessor.preprocess(item)
            x.append(' '.join(preprocessed_mail['keywords']))
            y.append(preprocessed_mail['label'])

        if self.vectorizer is None:
            keywords = self.__preprocessor.get_keywords()
            self.vectorizer_manager.train_and_save_vectorizer(keywords)
            self.vectorizer = self.vectorizer_manager.load_vectorizer()

        return self.vectorizer.transform(x), np.array(y)

    def __fit_model(self, x_train: np.ndarray, y_train: np.ndarray) -> BaggingClassifier:
        """
        Train the model using BaggingClassifier with AdaBoost base estimator.

        Parameters:
        - x_train: np.ndarray
            Training data features.
        - y_train: np.ndarray
            Training data labels.

        Returns:
        - BaggingClassifier
            Trained bagged AdaBoost classifier.

        """
        base_estimator = AdaBoostClassifier(random_state=self.__random_state, learning_rate=self.__learning_rate,
                                            n_estimators=self.__base_n_estimators)
        bagged_adaboost = BaggingClassifier(estimator=base_estimator, random_state=self.__random_state,
                                            n_estimators=self.__n_estimators)
        bagged_adaboost.fit(x_train, y_train)
        return bagged_adaboost

    def __calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, elapsed_time: float) -> Dict[str, Any]:
        """
        Calculate accuracy metrics.

        Parameters:
        - y_true: np.ndarray
            True labels.
        - y_pred: np.ndarray
            Predicted labels.
        - elapsed_time: float
            Elapsed time for training.

        Returns:
        - Dict[str, Any]
            Dictionary containing metrics including start and end time of training,
            elapsed training time, accuracy per label, and global accuracy.

        """
        accuracy: float = accuracy_score(y_true, y_pred)
        per_label_accuracy: Dict[str, float] = {label: accuracy_score(y_true[y_true == label], y_pred[y_true == label])
                                                for label in self.__class_mapping}
        return {
            'elapsed_training_time': f"{int((elapsed_time % 3600) / 60)} minutes, {int(elapsed_time % 60)} seconds",
            'accuracy_per_label': per_label_accuracy,
            'accuracy_global': accuracy
        }
