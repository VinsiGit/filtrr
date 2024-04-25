import json
import re
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer
from typing import List, Dict
from prefect.logging import get_logger

class TextPreprocessor:
    """
    Class for preprocessing text data, including loading keywords and extracting relevant tokens.
    """
    def __init__(self):
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


    def load_keywords(self,keyword_file_path:str):
        log = get_logger()
        def read_keywords(file_path) -> List[str]:
            try:
                with open(file=file_path, mode='r', encoding='utf-8') as f:
                    keywords_json = json.load(f)
                    return keywords_json.get('keywords', [])
            except FileNotFoundError:
                log.info(f"File '{file_path}' not found.")
                return ["data analytics", "machine learning", "cloud computing", "devops", "infrastructure-as-code"]

        def normalize_keyword(keyword: str) -> str:
            cleaned_keyword = re.sub(r'[^a-zA-Z0-9\s]', '', keyword.lower())
            stemmed_keyword = self.stemmer.stem(cleaned_keyword)
            return stemmed_keyword


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

        text = email.get('text_body', '')
        tokens = get_tokens(text)
        keywords = extract_keyword_tokens(tokens)
        keywords.sort()
        email.update({'keywords': keywords})
        return email