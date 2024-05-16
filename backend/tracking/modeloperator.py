import mlflow
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
        email_keywords = self.preprocessor.preprocess(email)
        text_email_keywords = [' '.join(email_keywords)]
        sparse_text_vector = self.vectorizer.transform(text_email_keywords)
        label = self.classifier.predict(sparse_text_vector)
        email['label'] = label
        email['keywords'] = email_keywords
        email['text_body'] = ""
        return email