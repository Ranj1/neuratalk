// import React from "react"
import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/Home";
import ChatPage from "./pages/Chat";
import VoiceScreenPage from "./pages/VoiceScreen";
import "./App.css";

function App() {
  // Global authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        // Clear any stale user data
        localStorage.removeItem("user");
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/voice/:sessionId" element={<VoiceScreenPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;




