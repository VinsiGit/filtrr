import os
class Operator:
    def __init__(self, model_dir):
        self.__model_dir = model_dir
        self.preprocessor = None
        self.vectorizer = None
        self.classifier = None

    def load_models(self):
        def load_preprocessor():
            pass

        def load_vectorizer():
            pass

        def load_classifier():
            pass