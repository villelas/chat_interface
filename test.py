# test_env.py
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Retrieve the OpenAI API key
api_key = os.environ.get("OPENAI_API_KEY")

# Check if the API key is loaded and print a message
if api_key:
    print("API key successfully loaded:", api_key[:5] + "..." )  # Show only the first few characters for security
else:
    print("API key not found! Please check your .env file.")

