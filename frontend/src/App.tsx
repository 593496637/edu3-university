import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { WalletProvider } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import Courses from "./pages/Courses";
import Staking from "./pages/Staking";
import Profile from "./pages/Profile";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <WalletProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/courses" replace />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </WalletProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
