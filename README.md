# PurifAI 🧹✨

An AI-powered data cleaning tool with intelligent imputation and comprehensive quality control reporting.

## 🎯 Overview

**PurifAI** is an AI-assisted data cleaning tool that (in the prototype/poc version):

* Accepts CSV file uploads through a modern web interface
* Uses k-NN (k-Nearest Neighbors) imputation to fill missing numeric values
* Generates quality control (QC) reports showing before/after missing data statistics
* Provides downloadable outputs (cleaned CSV, QC JSON, and PDF report)

## 🏗️ Architecture

### **Frontend (React):**
* `UploadPage.jsx`: File upload interface with progress indication and method selection
* `ResultsPage.jsx`: Displays QC summary table and download links
* `App.js`: Routes between upload and results pages
* `enhanced-styles.css`: Modern dark theme with glassmorphism effects

### **Backend (FastAPI):**
* `main.py`: Handles file processing, k-NN imputation, and generates outputs
* Creates three types of outputs: cleaned CSV, QC JSON summary, PDF report
* CORS enabled for seamless frontend-backend communication

## ✨ Key Features

1. **🤖 Smart Data Cleaning**: Uses scikit-learn's KNNImputer with 3 neighbors for missing numeric data
2. **📊 QC Reporting**: Tracks missing values before/after cleaning per column
3. **📁 Multiple Export Formats**: CSV, JSON, and PDF outputs
4. **🎨 Modern UI**: Dark theme with smooth animations and responsive design
5. **📱 Mobile Friendly**: Responsive design that works on all devices
6. **⚡ Real-time Progress**: Visual progress indicators during processing
7. **🔄 Method Selection**: Choose between Mean, Median, or k-NN imputation methods

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
   pip install fastapi uvicorn pandas scikit-learn python-multipart reportlab
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
- Drag and drop your CSV file or click to browse
- Choose your preferred imputation method (Mean, Median, or k-NN)-- ONLY KNN WORKS IN CURRENT ITERATION
- Click "Upload & Process" to start cleaning

### Step 2: Review Results
- View the quality control summary with before/after statistics
- See detailed column-by-column analysis
- Check the improvement metrics

### Step 3: Download Outputs
- **Cleaned CSV**: Your dataset with missing values filled
- **QC JSON**: Technical report with detailed statistics
- **PDF Report**: Professional summary for documentation

## 📊 Sample Data

The repository includes test datasets with missing values.

## 🛠️ API Endpoints

### `POST /process`
Upload and process a CSV file with missing values.

**Request:** Multipart form data with CSV file  
**Response:** JSON with QC summary and file references

### `GET /download/{filename}`
Download processed files (CSV, JSON, or PDF).

**Parameters:** `filename` - Name of the file to download  
**Response:** File download

### `GET /`
Health check endpoint.

**Response:** `{"message": "Backend running"}`

## 🧪 Testing

Use the provided sample datasets to test different scenarios:

```bash
# Test with simple data
curl -X POST "http://localhost:8000/process" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@sample.csv"
```

## 🎨 UI Features

- **Modern Dark Theme**: Easy on the eyes with glassmorphism effects
- **Drag & Drop Upload**: Intuitive file upload experience
- **Real-time Progress**: Visual feedback during processing
- **Responsive Design**: Works perfectly on desktop and mobile
- **Interactive Elements**: Hover effects and smooth animations
- **Professional Results Display**: Clean tables and download cards

## 🔧 Configuration

### Backend Configuration
- **Upload Directory**: `uploads/` (auto-created)
- **Output Directory**: `outputs/` (auto-created)
- **k-NN Neighbors**: 3 (configurable in `main.py`)
- **CORS**: Enabled for all origins (restrict in production)

### Frontend Configuration
- **API Base URL**: `http://localhost:8000` (configurable)
- **Supported Formats**: CSV, Excel (.xlsx), JSON
- **Max File Size**: Limited by browser and server settings

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Roadmap

- [ ] Support for additional imputation methods (MICE, Iterative)
- [ ] Categorical data imputation
- [ ] Batch file processing
- [ ] User authentication and data persistence
- [ ] Advanced visualization charts
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

