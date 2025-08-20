# FOR EVALUATORS
## Project Links: On clicking the other document button on the official statathon page, post submission, a copy of the idea ppt was being downloaded. Hence below attached is the drive link for the actual other document (i.e the project report)

* Project Idea, Presentation & Report: https://drive.google.com/drive/folders/1gwuIwsRakRHgJeiHyMtnxED_iv1vDSbR?usp=drive_link

* GitHub Repository (Source Code): https://github.com/AlphaNOVA23/PurifAI

* Demo Video (Youtube): https://www.youtube.com/watch?v=D1TbUpI67WE

# PurifAI 🧹✨

An AI-powered data cleaning tool with intelligent imputation, robust outlier detection, and comprehensive quality control reporting.

## 🎯 Overview

**PurifAI** is an AI-assisted data cleaning tool that empowers users to upload raw CSV files and apply a suite of sophisticated algorithms to improve data quality. It automates the detection of outliers and the imputation of missing values, culminating in a professional, multi-page PDF report with rich visualizations that detail the entire cleaning process and its impact on the dataset.

This project was developed for **Statathon 2025**.

## 🏗️ Architecture

### **Frontend (React):**
* `UploadPage.jsx`: File upload interface with method selection.
* `ResultsPage.jsx`: Displays a QC summary and download links for all generated files.
* `UserGuide.jsx`: A comprehensive guide explaining the tool's features and methods.
* `App.js`: Handles routing between the application's pages.
* `enhanced-styles.css`: A modern, responsive dark theme.

### **Backend (FastAPI):**
* `main.py`: Handles file processing, all data cleaning logic, visualization, and report generation.
* Creates three types of outputs: a cleaned CSV, a QC JSON summary, and a multi-page PDF report.
* CORS enabled for seamless frontend-backend communication.

## ✨ Key Features

1.  **🤖 Advanced Outlier Detection**: Choose from three industry-standard algorithms:
    * **IQR (Interquartile Range)**
    * **Z-Score**
    * **Isolation Forest** (Machine Learning)
2.  **🧠 Intelligent Imputation**: Select from three methods to handle missing values:
    * **Mean**
    * **Median**
    * **k-NN (k-Nearest Neighbors)** (Machine Learning)
3.  **📊 Professional PDF Reporting**: Automatically generates a detailed report with:
    * High-level cleaning summary.
    * In-depth analysis and visualizations of the **original** dataset.
    * A "before and after" comparison to show the impact of cleaning.
    * A full analysis and visualizations of the **final, cleaned** dataset.
4.  **📁 Multiple Export Formats**: Download the cleaned data (CSV), a technical summary (JSON), and the full analytical report (PDF).
5.  **🎨 Modern UI**: A responsive dark theme that works seamlessly on desktop and mobile devices.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AlphaNOVA23/purifai.git
   cd purifai
   ```

2. **Install Python dependencies**
    ```bash
    # Create and activate a virtual environment
    python -m venv venv
    # On Windows: venv\Scripts\activate
    # On macOS/Linux: source venv/bin/activate

    pip install -r requirements.txt
    ```

3. **Create a New React App**
```bash
npx create-react-app frontend
cd frontend
```
- this will create a new frontend folder

4. **Install Node.js dependencies in the frontend folder**
   ```bash
   npm install react react-dom react-router-dom
   ```

5.**Copy Frontend Files**
 - After creating the React app, copy all files from the provided frontend files folder into the src folder within your newly created React app directory (`frontend`). This will replace the default files with your custom application files.

### Running the Application

1. **Start the FastAPI backend**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

2. **Start the React frontend**
   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## 📝 Usage

### Step 1: Upload Dataset
* Drag and drop your CSV file or click to browse.
* Choose your preferred outlier detection and imputation methods.
* Click "Start Cleaning" to begin the process.

### Step 2: Review Results
* View the quality control summary with before/after statistics.
* See which methods were applied to your data.

### Step 3: Download Outputs
* **Cleaned CSV**: Your dataset with outliers handled and missing values filled.
* **QC JSON**: A technical report with detailed statistics.
* **PDF Report**: The professional, multi-page summary with all visualizations.

## 📊 Sample Data

The repository includes test datasets with missing values.

## 🛠️ API Endpoints

### `POST /process`
Upload and process a CSV file.

* **Request:** Multipart form data with a CSV file and the selected `outlier_method` and `imputation_method`.
* **Response:** JSON with a QC summary and references to the downloadable files.

### `GET /download/{filename}`
Download the processed files (CSV, JSON, or PDF).

* **Parameters:** `filename` - The name of the file to download.
* **Response:** The requested file.

### `GET /health`
A health check endpoint for the backend.

* **Response:** `{"status": "ok"}`

## 🧪 Testing

Use the provided sample dataset/s to test different scenarios:

## 🎨 UI Features

- **Modern Dark Theme**: Easy on the eyes
- **Drag & Drop Upload**: Intuitive file upload experience
- **Real-time Progress**: Visual feedback during processing
- **Responsive Design**: Works perfectly on desktop browsers
- **Professional Results Display**: Clean tables and download cards

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## 📋 Roadmap

- [ ] Support for JSON upload.
- [ ] Support for additional imputation and outlier detection methods.
- [ ] Categorical data imputation
- [ ] Batch file processing
- [ ] User authentication and data persistence
- [ ] Advanced visualization charts
- [ ] Diagonostic tool
- [ ] Export to additional formats (Excel, Parquet)
- [ ] API rate limiting and security enhancements

## ⚠️ Known Issues

- Currently only handles numeric imputation
- Large files may cause timeout issues
- Browser localStorage has size limitations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [scikit-learn](https://scikit-learn.org/) for the k-NN imputation algorithm
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python web framework
- [React](https://reactjs.org/) for the frontend framework
- [ReportLab](https://www.reportlab.com/) for PDF generation

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/AlphaNOVA23/purifai/issues) page
2. Create a new issue if your problem isn't listed
3. Provide detailed information about your environment and the issue

---

