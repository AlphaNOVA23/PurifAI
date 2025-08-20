import os
import uuid
import json
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.ensemble import IsolationForest
from scipy.stats import zscore

# --- Imports for Visualization and PDF Reporting ---
import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors

# --- App Initialization ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


# --- Data Cleaning Logic ---
def detect_and_correct_outliers(df, method='iqr'):
    df_processed = df.copy()
    numeric_cols = df_processed.select_dtypes(include=np.number).columns
    outlier_indices = set()
    if method == 'isolation_forest':
        for col in numeric_cols:
            col_data = df_processed[[col]].dropna()
            if not col_data.empty:
                iso_forest = IsolationForest(contamination='auto', random_state=42)
                predictions = iso_forest.fit_predict(col_data)
                outlier_indices.update(col_data.index[predictions == -1])
    elif method == 'z-score':
        for col in numeric_cols:
            col_data = df[col].dropna()
            if col_data.empty or col_data.std() == 0: continue
            z_scores = np.abs(zscore(col_data))
            col_outlier_indices = col_data.index[z_scores > 3]
            outlier_indices.update(col_outlier_indices)
    elif method == 'iqr':
        for col in numeric_cols:
            col_data = df[col].dropna()
            if col_data.empty: continue
            Q1, Q3 = col_data.quantile(0.25), col_data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound, upper_bound = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
            col_outlier_indices = col_data.index[(col_data < lower_bound) | (col_data > upper_bound)]
            outlier_indices.update(col_outlier_indices)
    outliers_df = df.loc[list(outlier_indices)].copy()
    if not outliers_df.empty:
        df_processed.loc[list(outlier_indices), numeric_cols] = np.nan
    return df_processed, outliers_df

def impute_dynamically(df_to_process, method_choice='knn'):
    df_imputed = df_to_process.copy()
    numeric_cols = df_imputed.select_dtypes(include=np.number).columns
    if df_imputed[numeric_cols].isnull().values.any():
        if method_choice == 'knn':
            k = max(2, min(5, len(df_imputed.dropna()) - 1))
            if k > 1:
                imputer = KNNImputer(n_neighbors=k)
                df_imputed[numeric_cols] = imputer.fit_transform(df_imputed[numeric_cols])
        elif method_choice in ['median', 'mean']:
            imputer = SimpleImputer(strategy=method_choice)
            df_imputed[numeric_cols] = imputer.fit_transform(df_imputed[numeric_cols])
    return df_imputed


# --- Intelligent Report Generation ---

def select_columns_for_visualization(df):
    potential_cols = [col for col in df.columns if 'ID' not in col.upper() and df[col].nunique() < len(df)]
    categorical_cols = [col for col in potential_cols if df[col].dtype in ['object', 'category'] and 1 < df[col].nunique() <= 20]
    numerical_cols = [col for col in potential_cols if pd.api.types.is_numeric_dtype(df[col]) and df[col].nunique() > 1]
    categorical_cols.sort(key=lambda col: df[col].nunique(), reverse=True)
    return categorical_cols[:4], numerical_cols[:3]

def generate_professional_report(original_df, cleaned_df, summary, file_id):
    report_path = os.path.join(OUTPUT_DIR, f"{file_id}_report.pdf")
    doc = SimpleDocTemplate(report_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    plt.style.use('seaborn-v0_8-darkgrid')

    # --- Page 1: Title Page ---
    story.append(Paragraph("PurifAI Data Cleaning & Analysis Report", styles['h1']))
    story.append(Spacer(1, 0.5*inch)); story.append(Paragraph(f"Analysis of: {file_id}.csv", styles['h3']))
    story.append(Spacer(1, 0.2*inch)); story.append(Paragraph(f"Report Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(PageBreak())

    # --- Page 2: Cleaning Summary & Improvement ---
    story.append(Paragraph("Data Cleaning Summary", styles['h2']))
    summary_data = [["Metric", "Value"]]; 
    for key, value in summary.items(): summary_data.append([key.replace('_', ' ').title(), str(value)])
    summary_table = Table(summary_data, colWidths=[2.5*inch, 2.5*inch])
    summary_table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.darkslategray), ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke), ('ALIGN', (0,0), (-1,-1), 'CENTER'), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('BOTTOMPADDING', (0,0), (-1,0), 12), ('BACKGROUND', (0,1), (-1,-1), colors.gainsboro), ('GRID', (0,0), (-1,-1), 1, colors.black)]))
    story.append(summary_table); story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Data Cleaning & Improvement Analysis", styles['h2']))
    _, num_cols_orig = select_columns_for_visualization(original_df)
    if num_cols_orig:
        dist_col = num_cols_orig[0]
        story.append(Paragraph(f"Impact of Outlier Removal on '{dist_col}'", styles['h3']))
        plt.figure(figsize=(12, 6)); sns.kdeplot(original_df[dist_col].dropna(), color="red", label='Original', fill=True, alpha=0.5); sns.kdeplot(cleaned_df[dist_col].dropna(), color="blue", label='Cleaned', fill=True, alpha=0.5)
        plt.title(f'Distribution of {dist_col}: Before vs. After Cleaning', fontsize=16); plt.legend()
        path = os.path.join(OUTPUT_DIR, f"{file_id}_dist_comparison.png"); plt.savefig(path); plt.close()
        story.append(Image(path, width=7*inch, height=4*inch))
    story.append(PageBreak())

    # --- Section: Original Dataset Analysis ---
    cat_cols, num_cols = select_columns_for_visualization(original_df)
    
    story.append(Paragraph("Original Dataset Analysis", styles['h2']))
    story.append(Paragraph("This section provides an overview of the key variables in your dataset before any cleaning was applied.", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    for i, col in enumerate(cat_cols):
        if i > 0: story.append(PageBreak())
        story.append(Paragraph(f"Distribution of '{col}' (Original)", styles['h3']))
        plt.figure(figsize=(10, 7)); sns.countplot(data=original_df, y=col, order=original_df[col].value_counts().index, palette='viridis')
        plt.title(f"Counts for {col}", fontsize=16); plt.tight_layout()
        path = os.path.join(OUTPUT_DIR, f"{file_id}_bar_orig_{col}.png"); plt.savefig(path); plt.close()
        story.append(Image(path, width=7*inch, height=5*inch))
    story.append(PageBreak())
    
    for i, col in enumerate(num_cols):
        if i > 0: story.append(PageBreak())
        story.append(Paragraph(f"Distribution of '{col}' (Original)", styles['h3']))
        plt.figure(figsize=(10, 6)); sns.histplot(original_df[col].dropna(), kde=True, color='red')
        plt.title(f"Distribution of {col}", fontsize=16); plt.tight_layout()
        path = os.path.join(OUTPUT_DIR, f"{file_id}_hist_orig_{col}.png"); plt.savefig(path); plt.close()
        story.append(Image(path, width=7*inch, height=4.5*inch))
    story.append(PageBreak())

    # --- Section: Cleaned Dataset Analysis ---
    cat_cols_cleaned, num_cols_cleaned = select_columns_for_visualization(cleaned_df)

    story.append(Paragraph("Cleaned Dataset Analysis", styles['h2']))
    story.append(Paragraph("This section provides the same overview for the dataset *after* cleaning and imputation.", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))

    for i, col in enumerate(cat_cols_cleaned):
        if i > 0: story.append(PageBreak())
        story.append(Paragraph(f"Distribution of '{col}' (Cleaned)", styles['h3']))
        plt.figure(figsize=(10, 7)); sns.countplot(data=cleaned_df, y=col, order=cleaned_df[col].value_counts().index, palette='plasma')
        plt.title(f"Counts for {col}", fontsize=16); plt.tight_layout()
        path = os.path.join(OUTPUT_DIR, f"{file_id}_bar_cleaned_{col}.png"); plt.savefig(path); plt.close()
        story.append(Image(path, width=7*inch, height=5*inch))
    story.append(PageBreak())

    for i, col in enumerate(num_cols_cleaned):
        if i > 0: story.append(PageBreak())
        story.append(Paragraph(f"Distribution of '{col}' (Cleaned)", styles['h3']))
        plt.figure(figsize=(10, 6)); sns.histplot(cleaned_df[col].dropna(), kde=True, color='blue')
        plt.title(f"Distribution of {col}", fontsize=16); plt.tight_layout()
        path = os.path.join(OUTPUT_DIR, f"{file_id}_hist_cleaned_{col}.png"); plt.savefig(path); plt.close()
        story.append(Image(path, width=7*inch, height=4.5*inch))
    
    doc.build(story)
    return report_path


# --- Main Processing Pipeline ---
def run_cleaning_pipeline(df, outlier_choice, imputation_method):
    processed_df = df.copy()
    for col in processed_df.columns:
        processed_df[col] = pd.to_numeric(processed_df[col], errors='ignore')
    original_df = processed_df.copy()
    df_after_outlier, outliers_df = detect_and_correct_outliers(original_df, method=outlier_choice)
    cleaned_df = impute_dynamically(df_after_outlier, method_choice=imputation_method)
    summary = {
        "initial_rows": int(original_df.shape[0]), "final_rows": int(cleaned_df.shape[0]),
        "missing_before": int(original_df.isnull().sum().sum()), "missing_after": int(cleaned_df.isnull().sum().sum()),
        "outliers_detected": int(outliers_df.shape[0]), "outlier_method": outlier_choice,
        "imputation_method": imputation_method,
    }
    return original_df, cleaned_df, summary

# --- API Endpoints ---
@app.post("/process")
async def process_file(file: UploadFile = File(...), imputation_method: str = Form(...), outlier_method: str = Form(...)):
    if not file.filename.endswith('.csv'): raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    try:
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")
        with open(file_path, "wb") as buffer: buffer.write(await file.read())
        df = pd.read_csv(file_path)
        original_df, cleaned_df, qc_summary = run_cleaning_pipeline(df, outlier_method, imputation_method)
        cleaned_csv_path = os.path.join(OUTPUT_DIR, f"{file_id}_cleaned.csv")
        cleaned_df.to_csv(cleaned_csv_path, index=False)
        qc_summary_json_path = os.path.join(OUTPUT_DIR, f"{file_id}_summary.json")
        with open(qc_summary_json_path, 'w') as f: json.dump(qc_summary, f, indent=4)
        report_pdf_path = generate_professional_report(original_df, cleaned_df, qc_summary, file_id)
        return JSONResponse(content={
            "message": "File processed successfully.", "qc_summary": qc_summary,
            "files": { "csv": os.path.basename(cleaned_csv_path), "json": os.path.basename(qc_summary_json_path), "pdf": os.path.basename(report_pdf_path) }
        })
    except Exception as e:
        print(f"Error during processing: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during processing: {e}")

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if ".." in filename or "/" in filename: raise HTTPException(status_code=400, detail="Invalid filename.")
    if os.path.exists(file_path): return FileResponse(file_path, media_type='application/octet-stream', filename=filename)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/health")
def health_check(): return {"status": "ok"}
