
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TicketForm from './components/TicketForm';
import TicketPrintView from './components/TicketPrintView';
import History from './components/History';
import Generators from './components/Generators';
import Vehicles from './components/Vehicles';
import Dispatches from './components/Dispatches';
import Configuration from './components/Configuration';
import { initializeDB } from './utils/database';
import { LOGO_URL } from './constants';

// A simple empty component for the Generators view
// Generators component implemented in components/Generators.tsx

function App() {
  useEffect(() => {
    // Seed database on mount
    initializeDB();
  }, []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-ticket" element={<TicketForm />} />
          <Route path="/edit/:id" element={<TicketForm />} />
          <Route path="/history" element={<History />} />
          <Route path="/print/:id" element={<TicketPrintView />} />
          <Route path="/generators" element={<Generators />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/dispatches" element={<Dispatches />} />
          <Route path="/configuration" element={<Configuration />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
