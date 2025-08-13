import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./enhanced-styles.css"; // New CSS file with enhanced styles

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imputationMethod, setImputationMethod] = useState('knn');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const simulateProgress = () => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file first.");
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      setBusy(true);
      setProgress(0);
      const progressInterval = simulateProgress();

      const res = await fetch("http://localhost:8000/process", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      // Store both data and method used
      localStorage.setItem("qcData", JSON.stringify({...data, method: imputationMethod}));
      
      setTimeout(() => {
        navigate("/results");
      }, 500);
    } catch (e) {
      console.error(e);
      alert("Error processing file. Check backend logs.");
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
              className={`drop-zone ${dragActive ? 'dragover' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className="drop-icon">📊</div>
              <div className="drop-text">
                {file ? file.name : 'Drag & Drop your dataset here'}
              </div>
              <div className="drop-subtext">
                {file ? 'Click to change file' : 'or click to browse files'}
              </div>
              
              <input 
                type="file" 
                id="file-input" 
                className="file-input" 
                accept=".csv,.xlsx,.json"
                onChange={handleFileChange}
              />
              
              <button 
                className="upload-btn"
                onClick={handleUpload}
                disabled={busy || !file}
              >
                {busy ? "Processing..." : "Upload & Process"}
              </button>
              
              <div className="supported-formats">
                <span className="format-tag">CSV</span>
                <span className="format-tag">Excel (.xlsx)</span>
                <span className="format-tag">JSON</span>
              </div>
            </div>
          </section>

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
          <div className="status-dot"></div>
          <span className="status-message">PURIFAI READY</span>
        </div>
        
        <div className="connection-status">
          <div className="connection-dot"></div>
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}