import mlflow
from train_model_flow import main_flow

class Operator:
    def __init__(self):
        sqlite_uri = "sqlite:///mlflow.db"
        mlflow.set_tracking_uri(sqlite_uri)
        self.preprocessor = self.__load_preprocessor()
        self.vectorizer = self.__load_vectorizer()
        self.classifier = self.__load_classifier()

    def __load_preprocessor(self):
        model_uri = f"models:/Preprocessor@Production"
        p = mlflow.sklearn.load_model(model_uri)
        return p
    def __load_vectorizer(self):
        model_uri = f"models:/Vectorizer@Production"
        v = mlflow.sklearn.load_model(model_uri)
        return v
    def __load_classifier(self):
        model_uri = f"models:/Model@Production"
        c = mlflow.sklearn.load_model(model_uri)
        return c

    def classify(self,email):
        client = mlflow.MlflowClient()
        email_keywords = self.preprocessor.preprocess(email)
        text_email_keywords = [' '.join(email_keywords)]
        sparse_text_vector = self.vectorizer.transform(text_email_keywords)
        probabilities = self.classifier.predict_proba(sparse_text_vector)[0]
        label = self.classifier.predict(sparse_text_vector)
        email['predicted_label'] = label
        email['model_version'] = client.get_model_version_by_alias(name='Model', alias='Production')
        email['keywords'] = email_keywords
        email['certainty'] = probabilities
        email['body'] = ""
        return email

    def retrain(self):
        main_flow()
