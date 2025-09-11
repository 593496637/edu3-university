import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { WalletProvider } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import Courses from "./pages/Courses";
import CoursesOptimized from "./pages/CoursesOptimized";
import TestOptimized from "./pages/TestOptimized";
import TestToast from "./pages/TestToast";
import Staking from "./pages/Staking";
import Profile from "./pages/Profile";
import SimpleProfile from "./components/SimpleProfile";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <WalletProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/test" replace />} />
                <Route path="/test" element={<TestOptimized />} />
                <Route path="/test-toast" element={<TestToast />} />
                <Route path="/courses" element={<CoursesOptimized />} />
                <Route path="/courses-legacy" element={<Courses />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                <Route path="/profile-simple" element={<ErrorBoundary><SimpleProfile /></ErrorBoundary>} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </WalletProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
