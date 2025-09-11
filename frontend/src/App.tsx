import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { WalletProvider } from "./context/WalletContext";
import Layout from "./components/Layout";
import Courses from "./pages/Courses";
import Staking from "./pages/Staking";
import Profile from "./pages/Profile";
import SimpleProfile from "./components/SimpleProfile";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/courses" replace />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
              <Route path="/profile-simple" element={<ErrorBoundary><SimpleProfile /></ErrorBoundary>} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;
