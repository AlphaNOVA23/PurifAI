import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './UploadPage.jsx';
import ResultsPage from './ResultsPage.jsx';
import './enhanced-styles.css'; // Use the new single styles file

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}