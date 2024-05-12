# Use an official Python runtime as a parent image
FROM python:3.11.5

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY ./requirements.txt /app
COPY ./model_requirements.txt /app

# Install any needed packages specified in requirements.txt
RUN pip install -r requirements.txt

# Install any needed packages specified in model_requirements.txt
RUN pip install -r model_requirements.txt

# Download the stopwords from nltk
RUN python -m nltk.downloader stopwords

# Copy the current directory contents into the container at /app
COPY . /app

# Expose the port that Gunicorn will run on
EXPOSE 5000

# Command to run the application using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]

