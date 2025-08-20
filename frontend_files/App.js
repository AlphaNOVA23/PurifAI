import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './UploadPage.jsx';
import ResultsPage from './ResultsPage.jsx';
import UserGuide from './UserGuide.jsx'; // Import the new component
import './enhanced-styles.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/guide" element={<UserGuide />} /> {/* Add the new route */}
      </Routes>
    </Router>
  );
}
