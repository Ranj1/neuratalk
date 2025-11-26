import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import ChatWindowContainer from "../ChatWindowContainer";
import API from "../../api";
import styles from "./index.module.css";

const Chat = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Check login on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const isAuth = !!token;
    setIsAuthenticated(isAuth);
    
    if (!isAuth) {
      // Redirect to home if not authenticated
      navigate("/");
    }
  }, [navigate]);

  const loadSession = async (sessionId) => {
    try {
      setIsLoading(true);
      const res = await API.get(`/chat/${sessionId}`);
      const sessionMessages = res.data
        .map((q) => [
          { 
            sender: "user", 
            text: q.questionText,
            timestamp: new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          { 
            sender: "bot", 
            text: q.answerText,
            timestamp: new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
        .flat();
      setMessages(sessionMessages);
      setSelectedSession(sessionId);
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async (sessionId) => {
    setSelectedSession(sessionId);
    setMessages([]);
  };

  const handleVoiceClick = async () => {
    if (!selectedSession) {
      try {
        const res = await API.post("/chat/new");
        setSelectedSession(res.data._id);
        setMessages([]);
      } catch (err) {
        console.error("Failed to create new chat:", err);
        return;
      }
    }
    navigate(`/voice/${selectedSession}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setSelectedSession(null);
    setMessages([]);
    navigate("/");
  };

  const handleTextSubmit = async (messageText) => {
    console.log("Text submit triggered", {
      messageText: messageText,
      selectedSession: selectedSession,
      isAuthenticated: isAuthenticated
    });
    
    if (!messageText || !messageText.trim()) {
      console.log("No input value or empty");
      return;
    }
    
    if (!selectedSession) {
      console.log("No selected session, creating new one");
      try {
        const res = await API.post("/chat/new");
        setSelectedSession(res.data._id);
      } catch (err) {
        console.error("Failed to create new chat:", err);
        return;
      }
    }

    // Add user message immediately
    const userMessage = {
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      console.log("Sending message to API:", messageText);
      const res = await API.post(`/chat/${selectedSession}/question`, { questionText: messageText });
      console.log("API response:", res.data);
      
      const botMessage = {
        sender: "bot",
        text: res.data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMessage = {
        sender: "bot",
        text: "Sorry, I couldn't process your message. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Show loading or redirect to home if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={styles.chatgptContainer}>
        <div className={styles.loadingScreen}>
          <div className={styles.spinner}></div>
          <p>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatgptContainer}>
      {/* Single container div with both Sidebar and ChatWindowContainer */}
      <div className={styles.chatMainWrapper}>
        {/* Sidebar Component - Handles all sidebar content internally */}
        <Sidebar
          showSidebar={showSidebar}
          selectedSession={selectedSession}
          isLoading={isLoading}
          onNewChat={handleNewChat}
          onLoadSession={loadSession}
          onLogout={handleLogout}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* ChatWindowContainer Component - Contains Header, ChatWindow, and InputWrapper */}
        <ChatWindowContainer
          messages={messages}
          onSendMessage={handleTextSubmit}
          onVoiceClick={handleVoiceClick}
          isTyping={isTyping}
          isLoading={isLoading}
          selectedSession={selectedSession}
          onNewChat={() => {
            // This will be handled by Sidebar's new chat button
            setShowSidebar(true);
          }}
        />
      </div>
    </div>
  );
};

export default Chat;