import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./enhanced-styles.css";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imputationMethod, setImputationMethod] = useState('knn');
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
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const validateFile = (file) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!allowedTypes.some(type => file.type === type) && !file.name.toLowerCase().endsWith('.csv')) {
      setError("Please upload a CSV, Excel, or JSON file");
      return false;
    }
    
    if (file.size > maxSize) {
      setError("File size must be less than 50MB");
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleDropZoneClick = (e) => {
    if (e.target.classList.contains('upload-btn') || 
        e.target.closest('.upload-btn')) {
      return;
    }
    
    if (!busy) {
      fileInputRef.current?.click();
    }
  };

  const simulateProgress = () => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 300);
    return interval;
  };

  const checkBackendHealth = async () => {
    try {
      const response = await fetch("http://localhost:8000/health");
      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Backend health check failed:", error);
      throw new Error("Cannot connect to backend server. Please ensure it's running on port 8000.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }
    
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      setBusy(true);
      setProgress(5);
      
      // Check backend health first
      await checkBackendHealth();
      setProgress(15);

      const progressInterval = simulateProgress();

      const res = await fetch("http://localhost:8000/process", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.detail || `Server error: ${res.status}`;
        throw new Error(errorMessage);
      }

      setProgress(95);
      const data = await res.json();
      
      if (!data || !data.qc_summary) {
        throw new Error("Invalid response from server");
      }
      
      // Store data with method used
      const dataWithMethod = { ...data, method: imputationMethod };
      
      // Use in-memory storage instead of localStorage for artifacts
      window.qcData = dataWithMethod;
      
      setProgress(100);
      
      // Navigate after a brief delay to show completion
      setTimeout(() => {
        navigate("/results", { replace: true });
      }, 1000);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Error processing file. Please try again.");
      setProgress(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-container">
      <main className="main-content">
        <div className="upload-container">
          <header className="header">
            <h1 className="title">PurifAI</h1>
            <p className="subtitle">
              AI-powered data cleaning with intelligent imputation and comprehensive quality control reporting
            </p>
          </header>

          <div className="method-selector">
            <h3>Choose Imputation Method</h3>
            <div className="method-options">
              <div className="method-option">
                <input 
                  type="radio" 
                  id="method-mean" 
                  name="imputation" 
                  value="mean"
                  checked={imputationMethod === 'mean'}
                  onChange={(e) => setImputationMethod(e.target.value)}
                  disabled={busy}
                />
                <label htmlFor="method-mean">
                  <strong>Mean</strong><br />
                  <small>Average values</small>
                </label>
              </div>
              <div className="method-option">
                <input 
                  type="radio" 
                  id="method-median" 
                  name="imputation" 
                  value="median"
                  checked={imputationMethod === 'median'}
                  onChange={(e) => setImputationMethod(e.target.value)}
                  disabled={busy}
                />
                <label htmlFor="method-median">
                  <strong>Median</strong><br />
                  <small>Middle values</small>
                </label>
              </div>
              <div className="method-option">
                <input 
                  type="radio" 
                  id="method-knn" 
                  name="imputation" 
                  value="knn"
                  checked={imputationMethod === 'knn'}
                  onChange={(e) => setImputationMethod(e.target.value)}
                  disabled={busy}
                />
                <label htmlFor="method-knn">
                  <strong>k-NN</strong><br />
                  <small>Smart prediction</small>
                </label>
              </div>
            </div>
          </div>

          <section className="upload-section">
            <div 
              className={`drop-zone ${dragActive ? 'dragover' : ''} ${busy ? 'processing' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="drop-content" onClick={handleDropZoneClick}>
                <div className="drop-icon">📊</div>
                <div className="drop-text">
                  {file ? file.name : 'Drag & Drop your dataset here'}
                </div>
                <div className="drop-subtext">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or click to browse files'}
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="file-input" 
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileChange}
                disabled={busy}
              />
              
              <button 
                className="upload-btn"
                onClick={handleUpload}
                disabled={busy || !file}
                type="button"
              >
                {busy ? `Processing... ${Math.round(progress)}%` : "Upload & Process"}
              </button>
              
              <div className="supported-formats">
                <span className="format-tag">CSV</span>
                <span className="format-tag">Excel (.xlsx)</span>
                <span className="format-tag">JSON</span>
              </div>
            </div>
          </section>

          {error && (
            <div className="error-section" style={{
              background: 'rgba(255, 71, 87, 0.1)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginTop: '1rem',
              color: '#ff4757'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {busy && (
            <div className="progress-section active">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                Processing {file?.name} with {imputationMethod.toUpperCase()} imputation... {Math.round(progress)}%
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="status-bar">
        <div className="status-indicator">
          <div className={`status-dot ${busy ? 'processing' : ''}`}></div>
          <span className="status-message">
            {busy ? 'PROCESSING' : 'PURIFAI READY'}
          </span>
        </div>
        
        <div className="connection-status">
          <div className="connection-dot"></div>
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}