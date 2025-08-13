import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./enhanced-styles.css";

export default function ResultsPage() {
  const [qcData, setQcData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("qcData");
    if (raw) setQcData(JSON.parse(raw));
  }, []);

  if (!qcData) {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>No QC data found</h2>
            <p>Please upload a CSV first from the Upload page.</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Go to Upload
            </button>
          </div>
        </main>
      </div>
    );
  }

  const checks = qcData.qc_summary?.qc_checks ?? {};
  const cleaned = qcData.qc_summary?.cleaned_file;
  const qcJson = qcData.qc_summary_json;
  const pdf = qcData.report_pdf;
  const method = qcData.method || 'k-NN';
  
  // Calculate statistics
  const totalColumns = Object.keys(checks).length;
  const totalMissingBefore = Object.values(checks).reduce((sum, col) => sum + col.before, 0);
  const totalMissingAfter = Object.values(checks).reduce((sum, col) => sum + col.after, 0);
  const columnsImproved = Object.values(checks).filter(col => col.after < col.before).length;
  const improvementRate = totalMissingBefore > 0 ? ((totalMissingBefore - totalMissingAfter) / totalMissingBefore * 100).toFixed(1) : 0;

  return (
    <div className="app-container">
      <main className="main-content">
        <header className="header">
          <h1 className="title">Quality Control Results</h1>
          <p className="subtitle">
            Data cleaning completed using {method} imputation method
          </p>
        </header>

        <div className="results-grid">
          {/* Statistics Overview */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span>📊</span>
                Processing Summary
              </h2>
            </div>
            <div className="card-body">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{totalColumns}</div>
                  <div className="stat-label">Total Columns</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{totalMissingBefore}</div>
                  <div className="stat-label">Missing Values Before</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{totalMissingAfter}</div>
                  <div className="stat-label">Missing Values After</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{improvementRate}%</div>
                  <div className="stat-label">Improvement Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* QC Details Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span>🔍</span>
                Detailed QC Report
              </h2>
            </div>
            <div className="card-body">
              <div className="qc-table-container">
                <table className="qc-table">
                  <thead>
                    <tr>
                      <th>Column Name</th>
                      <th>Before Cleaning</th>
                      <th>After Cleaning</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(checks).map(([col, data]) => (
                      <tr key={col}>
                        <td>
                          <strong>{col}</strong>
                        </td>
                        <td>
                          <span className="missing-count">{data.before}</span>
                        </td>
                        <td>
                          <span className="missing-count">{data.after}</span>
                        </td>
                        <td>
                          <div className="value-change">
                            {data.after < data.before ? (
                              <span className="change-indicator improved">
                                ✓ Improved
                              </span>
                            ) : (
                              <span className="change-indicator unchanged">
                                - No Missing Data
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Downloads Section */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span>💾</span>
                Download Results
              </h2>
            </div>
            <div className="card-body">
              <div className="downloads-section">
                <div className="download-card">
                  <div className="download-icon">📄</div>
                  <div className="download-title">Cleaned Dataset</div>
                  <div className="download-description">
                    Your processed CSV file with imputed values
                  </div>
                  <a
                    href={`http://localhost:8000/download/${cleaned}`}
                    className="download-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download CSV
                  </a>
                </div>

                <div className="download-card">
                  <div className="download-icon">🔧</div>
                  <div className="download-title">QC Report (JSON)</div>
                  <div className="download-description">
                    Technical report with detailed statistics
                  </div>
                  <a
                    href={`http://localhost:8000/download/${qcJson}`}
                    className="download-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download JSON
                  </a>
                </div>

                <div className="download-card">
                  <div className="download-icon">📋</div>
                  <div className="download-title">Summary Report</div>
                  <div className="download-description">
                    Professional PDF report for documentation
                  </div>
                  <a
                    href={`http://localhost:8000/download/${pdf}`}
                    className="download-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card">
            <div className="card-body">
              <div className="action-buttons">
                <button 
                  className="btn-secondary" 
                  onClick={() => navigate("/")}
                >
                  Process Another File
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => window.print()}
                >
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