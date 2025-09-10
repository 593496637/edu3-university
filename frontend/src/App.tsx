import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { WalletProvider } from "./context/WalletContext";
import Layout from "./components/Layout";
import Courses from "./pages/Courses";
import Staking from "./pages/Staking";
import Profile from "./pages/Profile";

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/courses" replace />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
