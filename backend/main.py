from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
import pandas as pd
from sklearn.impute import KNNImputer
import uuid
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()  # ✅ Create app first

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev/testing; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your endpoints below
@app.get("/")
def root():
    return {"message": "Backend running"}

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/process")
async def process_file(file: UploadFile = File(...)):
    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Read CSV
    df = pd.read_csv(file_path)

    # QC before cleaning
    qc_before = df.isnull().sum().to_dict()

    # Apply KNN Imputation (numeric only)
    numeric_df = df.select_dtypes(include=["float64", "int64"])
    imputer = KNNImputer(n_neighbors=3)
    df[numeric_df.columns] = imputer.fit_transform(numeric_df)

    # QC after cleaning
    qc_after = df.isnull().sum().to_dict()

    # Save cleaned CSV
    cleaned_filename = f"cleaned_{uuid.uuid4().hex}.csv"
    cleaned_path = os.path.join(OUTPUT_DIR, cleaned_filename)
    df.to_csv(cleaned_path, index=False)

    # QC summary JSON
    qc_summary = {
        "records_before": len(df),
        "qc_checks": {
            col: {"before": int(qc_before[col]), "after": int(qc_after[col])}
            for col in qc_before
        },
        "cleaned_file": cleaned_filename
    }

    # Save QC summary JSON file
    json_filename = f"qc_summary_{uuid.uuid4().hex}.json"
    json_path = os.path.join(OUTPUT_DIR, json_filename)
    pd.Series(qc_summary).to_json(json_path)

    # Generate PDF report
    report_filename = f"report_{uuid.uuid4().hex}.pdf"
    report_path = os.path.join(OUTPUT_DIR, report_filename)

    c = canvas.Canvas(report_path, pagesize=letter)
    c.setFont("Helvetica", 16)
    c.drawString(50, 750, "PurifAI – QC Summary Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, 720, f"Records before cleaning: {len(df)}")
    c.drawString(50, 700, "QC Checks (Before → After):")
    y = 680
    for col in qc_before:
        c.drawString(60, y, f"{col}: {qc_before[col]} → {qc_after[col]}")
        y -= 20
    c.drawString(50, y - 10, f"Cleaned File: {cleaned_filename}")
    c.save()

    return JSONResponse(content={
        "qc_summary": qc_summary,
        "qc_summary_json": json_filename,
        "report_pdf": report_filename
    })

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    return FileResponse(file_path, media_type="application/octet-stream", filename=filename)
