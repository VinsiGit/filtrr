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

RUN python train_model_flow.py

# Make the start.sh script executable
RUN chmod +x start.sh

# Expose the ports used by the services
EXPOSE 5000
EXPOSE 5001

# Run the shell script
CMD ["./start.sh"]