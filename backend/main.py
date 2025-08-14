from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.impute import KNNImputer, SimpleImputer
import uuid
import os
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

app = FastAPI()

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
    return {"message": "PurifAI Backend running"}

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/process")
async def process_file(file: UploadFile = File(...)):
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Read CSV
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading CSV file: {str(e)}")

        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")

        # QC before cleaning
        qc_before = df.isnull().sum().to_dict()

        # Apply KNN Imputation (numeric only for now - you can extend this)
        numeric_df = df.select_dtypes(include=["float64", "int64", "float32", "int32"])
        
        if not numeric_df.empty:
            # Create a copy to avoid modifying original dataframe
            df_cleaned = df.copy()
            
            # Apply KNN imputation to numeric columns
            imputer = KNNImputer(n_neighbors=3)
            df_cleaned[numeric_df.columns] = imputer.fit_transform(numeric_df)
        else:
            df_cleaned = df.copy()
            print("No numeric columns found for imputation")

        # QC after cleaning
        qc_after = df_cleaned.isnull().sum().to_dict()

        # Generate unique filenames
        unique_id = uuid.uuid4().hex[:8]
        cleaned_filename = f"cleaned_{unique_id}.csv"
        json_filename = f"qc_summary_{unique_id}.json"
        report_filename = f"report_{unique_id}.pdf"

        # Save cleaned CSV
        cleaned_path = os.path.join(OUTPUT_DIR, cleaned_filename)
        df_cleaned.to_csv(cleaned_path, index=False)

        # Create QC summary
        qc_summary = {
            "records_before": len(df),
            "records_after": len(df_cleaned),
            "columns_total": len(df.columns),
            "qc_checks": {
                col: {
                    "before": int(qc_before.get(col, 0)), 
                    "after": int(qc_after.get(col, 0))
                }
                for col in df.columns
            },
            "cleaned_file": cleaned_filename,
            "processing_method": "KNN Imputation (k=3)",
            "timestamp": pd.Timestamp.now().isoformat()
        }

        # Save QC summary JSON file
        json_path = os.path.join(OUTPUT_DIR, json_filename)
        with open(json_path, 'w') as f:
            json.dump(qc_summary, f, indent=2)

        # Generate PDF report
        report_path = os.path.join(OUTPUT_DIR, report_filename)
        create_pdf_report(report_path, qc_summary, df.shape[0])

        # Verify files were created
        for file_path, filename in [
            (cleaned_path, cleaned_filename),
            (json_path, json_filename), 
            (report_path, report_filename)
        ]:
            if not os.path.exists(file_path):
                raise HTTPException(status_code=500, detail=f"Failed to create {filename}")

        return JSONResponse(content={
            "qc_summary": qc_summary,
            "qc_summary_json": json_filename,
            "report_pdf": report_filename,
            "status": "success"
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

def create_pdf_report(report_path, qc_summary, total_records):
    """Create a detailed PDF report"""
    try:
        c = canvas.Canvas(report_path, pagesize=letter)
        width, height = letter
        
        # Title
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, height - 80, "PurifAI - QC Summary Report")
        
        # Subtitle
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 110, f"Generated: {qc_summary.get('timestamp', 'N/A')}")
        c.drawString(50, height - 130, f"Processing Method: {qc_summary.get('processing_method', 'KNN Imputation')}")
        
        # Summary stats
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 170, "Summary Statistics")
        
        c.setFont("Helvetica", 12)
        y_pos = height - 200
        c.drawString(70, y_pos, f"Total Records: {total_records}")
        y_pos -= 25
        c.drawString(70, y_pos, f"Total Columns: {qc_summary.get('columns_total', 0)}")
        y_pos -= 25
        
        # Calculate total missing values
        total_before = sum(col['before'] for col in qc_summary['qc_checks'].values())
        total_after = sum(col['after'] for col in qc_summary['qc_checks'].values())
        
        c.drawString(70, y_pos, f"Missing Values Before: {total_before}")
        y_pos -= 20
        c.drawString(70, y_pos, f"Missing Values After: {total_after}")
        y_pos -= 20
        c.drawString(70, y_pos, f"Values Imputed: {total_before - total_after}")
        
        # Column details
        y_pos -= 50
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y_pos, "Column-wise QC Results")
        
        y_pos -= 30
        c.setFont("Helvetica-Bold", 10)
        c.drawString(70, y_pos, "Column Name")
        c.drawString(200, y_pos, "Before")
        c.drawString(260, y_pos, "After")
        c.drawString(320, y_pos, "Improvement")
        
        y_pos -= 20
        c.setFont("Helvetica", 9)
        
        for col_name, data in qc_summary['qc_checks'].items():
            if y_pos < 100:  # Start new page if needed
                c.showPage()
                y_pos = height - 80
            
            before = data['before']
            after = data['after']
            improvement = "Yes" if after < before else "No change"
            
            # Truncate long column names
            display_name = col_name[:25] + "..." if len(col_name) > 25 else col_name
            
            c.drawString(70, y_pos, display_name)
            c.drawString(200, y_pos, str(before))
            c.drawString(260, y_pos, str(after))
            c.drawString(320, y_pos, improvement)
            y_pos -= 15
        
        c.save()
        
    except Exception as e:
        print(f"Error creating PDF: {str(e)}")
        # Create a simple fallback PDF
        c = canvas.Canvas(report_path, pagesize=letter)
        c.setFont("Helvetica", 12)
        c.drawString(50, 750, "PurifAI - QC Summary Report")
        c.drawString(50, 720, f"Records processed: {total_records}")
        c.drawString(50, 700, f"Processing completed with some limitations")
        c.drawString(50, 680, f"Please check the JSON file for detailed results")
        c.save()

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download endpoint with better error handling"""
    try:
        file_path = os.path.join(OUTPUT_DIR, filename)
        
        # Security check - ensure filename doesn't contain path traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
        
        # Determine media type based on extension
        if filename.endswith('.csv'):
            media_type = "text/csv"
        elif filename.endswith('.json'):
            media_type = "application/json"
        elif filename.endswith('.pdf'):
            media_type = "application/pdf"
        else:
            media_type = "application/octet-stream"
        
        return FileResponse(
            file_path, 
            media_type=media_type, 
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail="Download failed")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "upload_dir": os.path.exists(UPLOAD_DIR),
        "output_dir": os.path.exists(OUTPUT_DIR),
        "files_in_output": len(os.listdir(OUTPUT_DIR)) if os.path.exists(OUTPUT_DIR) else 0
    }