import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CheckPage from './pages/CheckPage';
import NewCheckPage from './pages/NewCheckPage';
import ComparePage from './pages/ComparePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="new" element={<NewCheckPage />} />
          <Route path="check/:checkId" element={<CheckPage />} />
          <Route path="check/:checkId/compare/:fileAId/:fileBId" element={<ComparePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
