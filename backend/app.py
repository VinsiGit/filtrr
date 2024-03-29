# app.py
from flask import Flask

app = Flask(__name__)

@app.route('/api')
def hello():
    return 'Filtrr api'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
