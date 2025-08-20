import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./enhanced-styles.css";

const API_BASE_URL = 'http://localhost:8000';

export default function ResultsPage() {
  // State to hold the entire response object
  const [qcResponse, setQcResponse] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve the QC response from localStorage
    const rawResponse = localStorage.getItem("qcResponse");
    if (rawResponse) {
      try {
        setQcResponse(JSON.parse(rawResponse));
      } catch (error) {
        console.error("Error parsing QC response from localStorage:", error);
      }
    }
  }, []);

  const handleDownload = async (filename, type) => {
    setDownloadError(null);
    if (!filename) {
      setDownloadError(`No ${type} file available for download.`);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/download/${filename}`);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (err) {
      setDownloadError(err.message);
    }
  };
  
  const summary = qcResponse?.qc_summary || {};
  const { csv, json, pdf } = qcResponse?.files || {};

  if (!qcResponse) {
    return (
      <div className="app-container">
        <main className="main-content" style={{textAlign: 'center'}}>
            <div className="header">
                <h1 className="title">Processing Error</h1>
                <p className="subtitle">Could not load cleaning summary. Please go back and try again.</p>
            </div>
            <button className="btn-primary" style={{marginTop: '2rem'}} onClick={() => navigate("/")}>
                Go Back
            </button>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="main-content">
        <div className="header">
          <h1 className="title">PurifAI Cleaning Report</h1>
          <p className="subtitle">
            Results for your dataset based on the selected cleaning methods.
          </p>
        </div>

        <div className="results-grid">
          {/* QC Summary Card */}
          <div className="card qc-summary-card">
            <div className="card-header">
              <h2>QC Summary</h2>
              <p>Key metrics from the cleaning process.</p>
            </div>
            <div className="card-body">
              <table className="qc-table">
                <tbody>
                  <tr>
                    <th>Initial Rows</th>
                    <td>{summary.initial_rows || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Final Rows</th>
                    <td>{summary.final_rows || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Missing Values (Before)</th>
                    <td>{summary.missing_before || 'N/A'}</td>
                  </tr>
                   <tr>
                    <th>Missing Values (After)</th>
                    <td>{summary.missing_after || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Outliers Detected</th>
                    <td>{summary.outliers_detected || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Methods Card */}
          <div className="card methods-card">
             <div className="card-header">
              <h2>Methods Applied</h2>
              <p>Algorithms used for this session.</p>
            </div>
            <div className="card-body">
                <div className="method-item">
                    <span className="method-label">Outlier Detection</span>
                    <span className="method-value">{summary.outlier_method?.toUpperCase() || 'N/A'}</span>
                </div>
                 <div className="method-item">
                    <span className="method-label">Imputation</span>
                    <span className="method-value">{summary.imputation_method?.toUpperCase() || 'N/A'}</span>
                </div>
            </div>
          </div>
          
          {/* Downloads Card */}
          <div className="card download-card">
            <div className="card-header">
              <h2>Downloads</h2>
              <p>Access your cleaned data and reports.</p>
            </div>
            <div className="card-body">
               {downloadError && <p className="error-message" style={{color: 'var(--danger-color)', marginBottom: '1rem'}}>{downloadError}</p>}
              <div className="download-grid">
                <div className="download-item">
                  <div className="download-title">Cleaned Data</div>
                  <div className="download-description">The processed dataset in CSV format</div>
                  <button className="download-btn" onClick={() => handleDownload(csv, 'CSV')} disabled={!csv}>
                    Download CSV
                  </button>
                </div>
                <div className="download-item">
                  <div className="download-title">QC Summary</div>
                  <div className="download-description">Key metrics in a JSON file</div>
                   <button className="download-btn" onClick={() => handleDownload(json, 'JSON')} disabled={!json}>
                    Download JSON
                  </button>
                </div>
                <div className="download-item">
                  <div className="download-title">Full Report</div>
                  <div className="download-description">Professional PDF report with visualizations</div>
                  <button className="download-btn" onClick={() => handleDownload(pdf, 'PDF')} disabled={!pdf}>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card">
            <div className="card-body">
              <div className="action-buttons">
                <button className="btn-secondary" onClick={() => navigate("/")}>
                  Process Another File
                </button>
                <button className="btn-primary" onClick={() => window.print()}>
                  Print Results
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="status-bar">
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span className="status-message">PROCESSING COMPLETE</span>
        </div>
        <div className="connection-status">
          <div className="connection-dot"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}
