import json
import re
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer
from typing import List, Dict
from prefect.logging import get_logger
from pymongo import MongoClient
from os import environ as e

# Get the MongoDB connection details from environment variables
mongo_host = e.get('MONGO_HOST', 'db') 
mongo_port = int(e.get('MONGO_PORT', '27017'))
mongo_username = e.get('MONGO_USERNAME', 'root')
mongo_password = e.get('MONGO_PASSWORD', 'mongo')

print(mongo_host, mongo_port, mongo_username, mongo_password)


# Create a MongoDB client
client = MongoClient(host=mongo_host, port=mongo_port, username=mongo_username, password=mongo_password)

# Get the MongoDB database
db = client['filtrr_db']


class TextPreprocessor:
    """
    Class for preprocessing text data, including loading keywords and extracting relevant tokens.
    """
    def __init__(self, retrain = False):
        """
        Initialize TextPreprocessor.

        Parameters:
        - keyword_file_path (str): Path to the JSON file containing keywords.
        """
        self._keywords: List[str] = []

        self.stemmer = SnowballStemmer('english')

        self.__stopwords = set()
        self.__stopwords.update(stopwords.words('english'))
        self.__stopwords.update(stopwords.words('french'))
        self.__stopwords.update(stopwords.words('dutch'))
        self.__stopwords.update(stopwords.words('german'))
        self.retrain = retrain



    def load_keywords(self,keyword_file_path:str):
        log = get_logger()
        # ____________________________________________________________________________________
        def read_keywords(file_path) -> List[str]:
            try:
                with open(file=file_path, mode='r', encoding='utf-8') as f:
                    keywords_json = json.load(f)
                    return keywords_json.get('keywords', [])
            except FileNotFoundError:
                log.info(f"File '{file_path}' not found.")
                return ["data analytics", "machine learning", "cloud computing", "devops", "infrastructure-as-code"]
        # ____________________________________________________________________________________

        def read_keywords_from_db() -> List[str]:
            keywords = db.keywords.find_one()
            keywords.pop('_id', None)
            keywords = keywords.get('keywords', [])
            return keywords


        def normalize_keyword(keyword: str) -> str:
            cleaned_keyword = re.sub(r'[^a-zA-Z0-9\s]', '', keyword.lower())
            stemmed_keyword = self.stemmer.stem(cleaned_keyword)
            return stemmed_keyword

        if self.retrain:
            keywords = read_keywords_from_db()

        else:
            keywords = read_keywords(keyword_file_path)

        normalized_keywords = [normalize_keyword(keyword) for keyword in keywords]
        self._keywords = list(set(normalized_keywords))
        self._keywords.sort()


    def preprocess(self, email: Dict) -> Dict:
        """
        Preprocess email text by extracting relevant keywords.

        Parameters:
        - email (dict): Email data containing 'text_body'.

        Returns:
        - dict: Email data with additional 'keywords' field.
        """
        def get_tokens(mail_body: str) -> List[str]:
            for pattern in [r'\r', r'\n', r'\t', r'[^A-Za-z0-9\s]', r'\s+']:
                mail_body = re.sub(pattern, ' ', mail_body)
            mail_body = mail_body.lower()
            mail_body = mail_body.strip()
            word_tokens = mail_body.split(' ')
            word_tokens = [token for token in word_tokens if token not in self.__stopwords]
            return word_tokens

        def extract_keyword_tokens(word_tokens: List[str]) -> List[str]:
            interesting_tokens = []
            for token in word_tokens:
                for keyword in self._keywords:
                    if token in keyword:
                        interesting_tokens.append(token)
            return list(set(interesting_tokens))

        text = email.get('body', '')

        if email.get('keywords'):
            return email
        

        tokens = get_tokens(text)
        keywords = extract_keyword_tokens(tokens)
        keywords.sort()
        email.update({'keywords': keywords})
        return email