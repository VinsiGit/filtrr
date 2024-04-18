import os
import joblib
from typing import List, Union
from sklearn.feature_extraction.text import TfidfVectorizer

class VectorizerManager:
    """Class to train and save the TF-IDF vectorizer."""

    def __init__(self, vectorizer_file: str = 'models/tfidf_vectorizer.joblib'):
        """
        Initialize the VectorizerTrainer.

        Parameters:
        - vectorizer_file: str, optional (default='models/tfidf_vectorizer.joblib')
            File path to save the trained TF-IDF vectorizer.

        """
        self.vectorizer_file = vectorizer_file

    def train_and_save_vectorizer(self, x: List[str]) -> None:
        """
        Train TF-IDF vectorizer and save it to disk.

        Parameters:
        - x: List[str]
            List of textual data for training the vectorizer.

        """
        vectorizer = TfidfVectorizer()
        vectorizer.fit(x)
        joblib.dump(vectorizer, self.vectorizer_file)

    def load_vectorizer(self) -> Union[TfidfVectorizer, None]:
        """
        Load TF-IDF vectorizer from disk if available.

        Returns:
        - TfidfVectorizer
            Loaded TF-IDF vectorizer.

        """
        if os.path.exists(self.vectorizer_file):
            try:
                return joblib.load(self.vectorizer_file)
            except Exception as e:
                print(f"Error: An error occurred while loading the file '{self.vectorizer_file}': {str(e)}")
        else:
            print(f"Error: The file '{self.vectorizer_file}' does not exist.")
        return None
