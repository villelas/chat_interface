from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import pandas as pd
import io
from dotenv import load_dotenv
from typing import Optional
import os
# Load environment variables from .env file
load_dotenv()
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

class QueryRequest(BaseModel):
    prompt: str

class QueryResponse(BaseModel):
    visualization: Optional[str]
    description: str

uploaded_csv_df = None

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    global uploaded_csv_df
    try:
        # Check if the uploaded file is a CSV
        if file.content_type != 'text/csv':
            raise HTTPException(status_code=400, detail="Uploaded file is not a CSV.")

        contents = await file.read()
        uploaded_csv_df = pd.read_csv(io.BytesIO(contents))
        return {"columns": uploaded_csv_df.columns.tolist(), "sample": uploaded_csv_df.head().to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV file: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_openai(request: QueryRequest):
    try:
        if uploaded_csv_df is None:
            return QueryResponse(visualization=None, description="Please upload a dataset for me to work with.")

        # Check if the prompt matches a column name
        column_name = request.prompt.strip()
        if column_name in uploaded_csv_df.columns:
            sample_values = uploaded_csv_df[column_name].dropna().tolist()[:25]  # Limit sample values for brevity
            return QueryResponse(visualization=None, description=f"Here are some sample values from the '{column_name}' column: {sample_values}")

        # Extract information about the dataset
        columns_info = {
            col: {
                'type': 'quantitative' if pd.api.types.is_numeric_dtype(uploaded_csv_df[col]) else
                       'nominal' if pd.api.types.is_string_dtype(uploaded_csv_df[col]) else
                       'temporal' if pd.api.types.is_datetime64_any_dtype(uploaded_csv_df[col]) else
                       'unknown',
                'sample_values': uploaded_csv_df[col].dropna().tolist()[:25]  # Limit sample values for brevity
            }
            for col in uploaded_csv_df.columns
        }

        # Construct prompt for Vega-Lite specification generation
        prompt = (
            f"Based on the following dataset columns and their types:\n{columns_info}\n\n"
            f"User request: {request.prompt}\n"
            f"Please generate a Vega-Lite specification for a visualization putting first what the User response was to meet their needs."
            f"Do not include any introductory text, only return the JSON"
        )

        # Generate Vega-Lite specification
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-3.5-turbo",
        )

        vega_lite_spec = chat_completion.choices[0].message.content.strip()

        # Generate a description for the chart based on the Vega-Lite specification
        description_prompt = (
            f"Based on the following Vega-Lite specification:\n{vega_lite_spec}\n"
            f"Please provide a brief summary (1-2 sentences) of the chart."
        )

        description_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": description_prompt}],
            model="gpt-3.5-turbo",
        )

        chart_description = description_completion.choices[0].message.content.strip()

        return QueryResponse(visualization=vega_lite_spec, description=chart_description)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Data Visualization API"}
