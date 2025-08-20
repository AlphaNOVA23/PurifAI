import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./enhanced-styles.css";
import logo from './log_no_bg.png';

const API_BASE_URL = 'http://localhost:8000';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imputationMethod, setImputationMethod] = useState('knn');
  const [outlierMethod, setOutlierMethod] = useState('iqr');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (validateFile(e.dataTransfer.files[0])) {
        setFile(e.dataTransfer.files[0]);
      }
    }
  };

  const validateFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError("Invalid file type. Please upload a CSV file.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      if (validateFile(e.target.files[0])) {
        setFile(e.target.files[0]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 95));
    }, 200);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("imputation_method", imputationMethod);
    formData.append("outlier_method", outlierMethod);

    try {
      const response = await fetch(`${API_BASE_URL}/process`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "An unknown error occurred during processing.");
      }
      
      setProgress(100);
      localStorage.setItem("qcResponse", JSON.stringify(data));
      setTimeout(() => navigate("/results"), 500);

    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message);
      setProgress(0);
    } finally {
      setBusy(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="upload-main-box">
          <div className="upload-container">
            <div className="header">
              <img src={logo} alt="PurifAI Logo" className="logo" />
              <h1 className="title">PurifAI Data Cleaner</h1>
              <p className="subtitle">Upload your dataset to begin cleaning and processing.</p>
            </div>
            <form onSubmit={handleSubmit} className="upload-form">
              <div
                className={`drop-zone ${dragActive ? "drag-active" : ""} ${busy ? "processing" : ""}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" id="file-input" onChange={handleFileChange} accept=".csv" disabled={busy} />
                <div className="drop-content">
                  <div className="drop-icon"></div>
                  <p className="drop-text">
                    {file ? `Selected: ${file.name}` : "Drag & drop your CSV file here"}
                  </p>
                  <button type="button" className="browse-btn" onClick={onButtonClick} disabled={busy}>
                    Browse File
                  </button>
                </div>
              </div>

              <div className="options-grid">
                <div className="card option-card">
                  <div className="card-header">
                    <h2>Outlier Detection</h2>
                  </div>
                  <div className="card-body">
                    <div className="radio-group">
                      {['iqr', 'z-score', 'isolation_forest'].map(method => (
                        <label key={method} className={`radio-label ${outlierMethod === method ? 'selected' : ''}`}>
                          <input type="radio" name="outlierMethod" value={method} checked={outlierMethod === method} onChange={() => setOutlierMethod(method)} />
                          <span>{method === 'isolation_forest' ? 'Isolation Forest' : method.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card option-card">
                  <div className="card-header">
                    <h2>Imputation Method</h2>
                  </div>
                  <div className="card-body">
                    <div className="radio-group">
                      {['knn', 'median', 'mean'].map(method => (
                        <label key={method} className={`radio-label ${imputationMethod === method ? 'selected' : ''}`}>
                          <input type="radio" name="imputationMethod" value={method} checked={imputationMethod === method} onChange={() => setImputationMethod(method)} />
                          <span>{method.charAt(0).toUpperCase() + method.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Container */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => navigate('/guide')}
                  disabled={busy}
                >
                  User Guide
                </button>
                <button type="submit" className="btn-primary submit-btn" disabled={busy || !file}>
                  {busy ? "Processing..." : "Start Cleaning"}
                </button>
              </div>

              {error && (
                <div className="error-box">
                  <strong>Error:</strong> {error}
                </div>
              )}
              {busy && (
                <div className="progress-section active">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="progress-text">
                    Processing {file?.name}... {Math.round(progress)}%
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
      <div className="status-bar">
        <div className="status-indicator">
          <div className={`status-dot ${busy ? 'processing' : ''}`}></div>
          <span className="status-message">{busy ? 'PROCESSING' : 'PURIFAI READY'}</span>
        </div>
        <div className="connection-status">
          <div className="connection-dot"></div>
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}
