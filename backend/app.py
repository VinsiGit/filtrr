# This file is the entry point of the application. It creates the Flask app and registers the blueprints for the different routes.
# The app is configured with a secret key for JWT authentication and CORS support.
# The JWTManager is also initialized with the app.

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from os import environ as e
from routes.auth_routes import auth_routes
from routes.user_routes import user_routes
from routes.mail_routes import mail_routes
from routes.dashboard_routes import dashboard_routes
from routes.classification_routes import classification_routes

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = e.get('JWT_SECRET_KEY', 'very-secret-key')
CORS(app)
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_routes)
app.register_blueprint(user_routes)
app.register_blueprint(mail_routes)
app.register_blueprint(dashboard_routes)
app.register_blueprint(classification_routes)

@app.route('/api', methods=['GET'])
def check_status():
    return 'Filtrr API is running!', 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')