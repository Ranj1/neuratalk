import React, { useState, useEffect } from "react";
import { FiLogOut, FiMessageSquare, FiPlus, FiUser, FiEdit2, FiTrash2, FiSearch, FiX, FiZap } from "react-icons/fi";
import API from "../../api";
import styles from "./index.module.css";

const Sidebar = ({
  showSidebar = true,
  selectedSession = null,
  isLoading = false,
  onNewChat,
  onLoadSession,
  onLogout,
  onToggleSidebar,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToRename, setChatToRename] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch chat history on component mount
  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const res = await API.get("/chat/history");
      setChatHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  };

  // Filter chat history based on search query
  const filteredChatHistory = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleDeleteClick = (chat) => {
    setChatToDelete(chat);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsProcessing(true);
    try {
      await API.post(`/chat/${chatToDelete._id}/delete`);
      setChatHistory((prev) => prev.filter((c) => c._id !== chatToDelete._id));
      setShowDeleteModal(false);
      setChatToDelete(null);
    } catch (err) {
      console.error("Failed to delete chat:", err);
      alert("Failed to delete chat. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
    setChatToRename(null);
    setNewChatTitle("");
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  const handleNewChat = async () => {
    try {
      const res = await API.post("/chat/new");
      await fetchChatHistory(); // Refresh chat history
      onNewChat(res.data._id); // Notify parent component
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  const handleLoadSession = (sessionId) => {
    onLoadSession(sessionId);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  return (
    <>
      <div className={`${styles.sidebar} ${showSidebar ? styles.open : styles.closed} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* Icon/Logo at top */}
        <div className={styles.sidebarLogo}>
          <div 
            className={styles.logoIcon}
            onClick={() => {
              if (!showSidebar) {
                onToggleSidebar();
              }
            }}
            style={{ cursor: !showSidebar ? 'pointer' : 'default' }}
            title={!showSidebar ? "Click to open sidebar" : ""}
          >
            <FiZap size={24} />
          </div>
          {/* Close Button */}
          <button 
            onClick={() => {
              if (showSidebar) {
                onToggleSidebar();
              }
            }}
            className={styles.sidebarToggleBtn}
            title="Close sidebar"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Collapsed State - Show only essential elements */}
        {isCollapsed ? (
          <div className={styles.collapsedContent}>
            {/* Only show the logo and toggle button when collapsed */}
          </div>
        ) : (
          <>
            {/* New Chat Button */}
            <div className={styles.newChatSection}>
              <button 
                onClick={handleNewChat} 
                className={styles.newChatBtn}
                disabled={isLoading}
              >
                <FiZap size={16} />
                <span>New chat</span>
                {isLoading && <div className={styles.btnSpinner}></div>}
              </button>
            </div>

            <div className={styles.searchSection}>
              <div className={styles.searchWrapper}>
                <FiSearch size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search chats"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className={styles.searchClearBtn}
                    title="Clear search"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className={styles.conversationsSection}>
              <div className={styles.conversationsList}>
                {isLoading && !chatHistory.length ? (
                  <div className={styles.loadingConversations}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading conversations...</p>
                  </div>
                ) : filteredChatHistory.length > 0 ? (
                  filteredChatHistory.map((chat) => (
                    <div
                      key={chat._id}
                      className={`${styles.conversationItem} ${selectedSession === chat._id ? styles.active : ''}`}
                      onClick={() => handleLoadSession(chat._id)}
                    >
                      <div className={styles.conversationContent}>
                        <div className={styles.conversationHeader}>
                          <div className={styles.conversationTitle}>{chat.title || 'New Chat'}</div>
                          <div className={styles.conversationActions}>
                            <button
                              className={styles.actionBtn}
                              title="Rename conversation"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameClick(chat);
                              }}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              title="Delete conversation"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(chat);
                              }}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyConversations}>
                    <div className={styles.emptyIcon}>
                      <FiMessageSquare size={32} />
                    </div>
                    <p>No conversations yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* User Profile Section - Hidden when collapsed */}
        {!isCollapsed && (
          <div className={styles.userProfileSection}>
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                <FiUser size={16} />
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>My Account</span>
              </div>
            </div>
            <button onClick={onLogout} className={styles.logoutBtn} title="Logout">
              <FiLogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className={styles.modalOverlay} onClick={closeRenameModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Rename Chat</h3>
              <button className={styles.modalClose} onClick={closeRenameModal}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
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
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary} 
                onClick={closeRenameModal}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className={styles.btnPrimary} 
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
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
          <div className={`${styles.modalContent} ${styles.deleteModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Delete Chat</h3>
              <button className={styles.modalClose} onClick={closeDeleteModal}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.deleteWarning}>
                <FiTrash2 size={48} />
                <p>Are you sure you want to delete this chat?</p>
                <p className={styles.chatName}>"{chatToDelete?.title}"</p>
                <p className={styles.warningText}>This action cannot be undone.</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary} 
                onClick={closeDeleteModal}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className={styles.btnDanger} 
                onClick={handleDeleteConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? "Deleting..." : "Delete Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;