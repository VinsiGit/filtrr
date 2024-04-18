from preprocessor import Preprocessor
from modelmanager import ModelManager
from vectorizermanager import VectorizerManager

class ModelOperator:
    def __init__(self):
        self.__model_manager = ModelManager()
        self.__vectorizer_manager = VectorizerManager()

        self.__preprocessor = Preprocessor()
        self.__model = self.__model_manager.load_model()
        self.__vectorizer = self.__vectorizer_manager.load_vectorizer()

    def classify(self, mail):
        mail = self.__preprocessor.preprocess(mail)
        x = [' '.join(mail['keywords'])]
        v_x = self.__vectorizer.transform(x)
        mail['label'] = self.__model.predict(v_x)[0]
        return mail

