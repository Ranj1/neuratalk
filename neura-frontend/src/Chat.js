import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut,
  FiMessageSquare,
  FiMic,
  FiPlus,
  FiUser,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiMoreVertical,
  FiSend,
  FiClock,
  FiZap,
  FiX
} from "react-icons/fi";
import MarkdownPreview from '@uiw/react-markdown-preview';
import API from "./api";
import "../App.css";


import Message from "./components/Message";


const Chat = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToRename, setChatToRename] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check login on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const isAuth = !!token;
    setIsAuthenticated(isAuth);

    if (isAuth) {
      fetchChatHistory();
    } else {
      // Redirect to home if not authenticated
      navigate("/");
    }
  }, [navigate]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/chat/history");
      setChatHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      const res = await API.post("/chat/new");
      setSelectedSession(res.data._id);
      setMessages([]);
      await fetchChatHistory();
    } catch (err) {
      console.error("Failed to create new chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceClick = async () => {
    if (!selectedSession) {
      try {
        const res = await API.post("/chat/new");
        setSelectedSession(res.data._id);
        setMessages([]);
        await fetchChatHistory();
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
        await fetchChatHistory();
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

  const filteredChatHistory = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const inputValue = e.target.value;
      if (inputValue.trim()) {
        handleTextSubmit(inputValue);
      }
    }
  };

  // Handle rename chat
  const handleRenameClick = (chat) => {
    setChatToRename(chat);
    setNewChatTitle(chat.title);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async () => {
    if (!newChatTitle.trim() || newChatTitle === chatToRename.title) {
      setShowRenameModal(false);
      return;
    }

    setIsProcessing(true);
    try {
      await API.post(`/chat/${chatToRename._id}/rename`, { newTitle: newChatTitle.trim() });
      setChatHistory((prev) =>
        prev.map((c) => (c._id === chatToRename._id ? { ...c, title: newChatTitle.trim() } : c))
      );
      setShowRenameModal(false);
      setChatToRename(null);
      setNewChatTitle("");
    } catch (err) {
      console.error("Failed to rename chat:", err);
      alert("Failed to rename chat. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete chat
  const handleDeleteClick = (chat) => {
    setChatToDelete(chat);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsProcessing(true);
    try {
      await API.post(`/chat/${chatToDelete._id}/delete`);
      setChatHistory((prev) => prev.filter((c) => c._id !== chatToDelete._id));
      if (selectedSession === chatToDelete._id) {
        setSelectedSession(null);
        setMessages([]);
      }
      setShowDeleteModal(false);
      setChatToDelete(null);
    } catch (err) {
      console.error("Failed to delete chat:", err);
      alert("Failed to delete chat. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Close modals
  const closeRenameModal = () => {
    setShowRenameModal(false);
    setChatToRename(null);
    setNewChatTitle("");
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  // Show loading or redirect to home if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="chat-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  // ChatGPT-like UI
  return (
    <div className="chatgpt-container">
      {/* ChatGPT-style Sidebar */}
      <div className={`chatgpt-sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button
            onClick={handleNewChat}
            className="new-chat-btn"
            disabled={isLoading}
          >
            <FiPlus size={16} />
            <span>New chat</span>
            {isLoading && <div className="btn-spinner"></div>}
          </button>
        </div>

        <div className="search-section">
          <div className="search-wrapper">
            <FiSearch size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="conversations-section">
          <div className="conversations-list">
            {isLoading && !chatHistory.length ? (
              <div className="loading-conversations">
                <div className="loading-spinner"></div>
                <p>Loading conversations...</p>
              </div>
            ) : filteredChatHistory.length > 0 ? (
              filteredChatHistory.map((chat) => (
                <div
                  key={chat._id}
                  className={`conversation-item ${selectedSession === chat._id ? 'active' : ''}`}
                  onClick={() => loadSession(chat._id)}
                >
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <div className="conversation-title">{chat.title || 'New Chat'}</div>
                      <div className="conversation-actions">
                        <button
                          className="action-btn"
                          title="Rename conversation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameClick(chat);
                          }}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          className="action-btn"
                          title="Delete conversation"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(chat);
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-conversations">
                <div className="empty-icon">
                  <FiMessageSquare size={32} />
                </div>
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="user-profile-section">
          <div className="user-profile">
            <div className="user-avatar">
              <FiUser size={16} />
            </div>
            <div className="user-details">
              <span className="user-name">My Account</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <FiLogOut size={16} />
          </button>
        </div>
      </div>

      {/* ChatGPT-style Main Chat Area */}
      <div className="chatgpt-main">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="chatgpt-header">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="sidebar-toggle-btn"
                title="Toggle Sidebar"
              >
                <FiMoreVertical size={20} />
              </button>
              <div className="chat-title">
                <h1>ChatGPT</h1>
              </div>
            </div>

            {console.log(messages)}
            {/* Messages Area */}
            <div className="chatgpt-messages">
              {messages.map((msg, index) => (
                <Message message={msg} />
              ))}

              {isTyping && (
                <div className="message-container bot">
                  <Message message={{ sender: "bot", text: "I'm typing...", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} />
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="chatgpt-input-container">
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="message-input"
                  placeholder="Message ChatGPT..."
                  onKeyPress={handleKeyPress}
                  rows="1"
                  style={{ resize: 'none' }}
                />
                <button
                  className="send-button"
                  onClick={() => {
                    const input = inputRef.current;
                    if (input && input.value.trim()) {
                      handleTextSubmit(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={isLoading}
                >
                  <FiSend size={16} />
                </button>
                <button
                  className="voice-button"
                  onClick={handleVoiceClick}
                  disabled={isLoading}
                  title="Voice input"
                >
                  <FiMic size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="chatgpt-welcome">
            <div className="welcome-content">
              <div className="welcome-icon">
                <FiZap size={64} />
              </div>
              <h1>How can I help you today?</h1>
              <div className="welcome-actions">
                <button
                  onClick={handleNewChat}
                  className="welcome-btn"
                  disabled={isLoading}
                >
                  <FiPlus size={20} />
                  <span>Start new conversation</span>
                </button>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="welcome-btn secondary"
                >
                  <FiMessageSquare size={20} />
                  <span>Browse conversations</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={closeRenameModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rename Chat</h3>
              <button className="modal-close" onClick={closeRenameModal}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <label htmlFor="chat-title">Chat Title</label>
              <input
                id="chat-title"
                type="text"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter new chat title"
                maxLength={100}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit();
                  }
                }}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={closeRenameModal}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleRenameSubmit}
                disabled={isProcessing || !newChatTitle.trim() || newChatTitle === chatToRename?.title}
              >
                {isProcessing ? "Renaming..." : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Chat</h3>
              <button className="modal-close" onClick={closeDeleteModal}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FiTrash2 size={48} />
                <p>Are you sure you want to delete this chat?</p>
                <p className="chat-name">"{chatToDelete?.title}"</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={closeDeleteModal}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? "Deleting..." : "Delete Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;