import React, { useState, useEffect, useRef } from "react";
import { FiMic, FiSend, FiPlus, FiMessageSquare, FiZap } from "react-icons/fi";
import Header from "../Header";
import Message from "../Message";
import InputWrapper from "../InputWrapper";
import styles from "./index.module.css";

const ChatWindowContainer = ({ 
  messages = [], 
  onSendMessage, 
  onVoiceClick,
  isTyping = false,
  isLoading = false,
  selectedSession = null,
  onNewChat = null
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (messageText) => {
    if (messageText.trim() && onSendMessage) {
      onSendMessage(messageText.trim());
    }
  };

  const handleProfileClick = () => {
    // Handle profile click
    console.log("Profile clicked");
  };

  const renderMessage = (message, index) => {
    return <Message key={index} message={message} />;
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <div className={styles.typingIndicator}>
        <div className={styles.typingDots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.chatWindowContainer}>
      {/* Chat Content */}
      <div className={styles.chatContent}>
        {selectedSession ? (
          <div className={styles.chatWindow}>
            <div className={styles.chatMessages}>
              {messages.map((message, index) => renderMessage(message, index))}
              {renderTypingIndicator()}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeIcon}>
                <FiZap size={64} />
              </div>
              <h1>How can I help you today?</h1>
              <div className={styles.welcomeActions}>
                <button 
                  onClick={onNewChat}
                  className={styles.welcomeBtn}
                  disabled={isLoading}
                >
                  <FiZap size={20} />
                  <span>Start new conversation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* InputWrapper Component */}
      {selectedSession && (
        <InputWrapper
          onSendMessage={handleSubmit}
          onVoiceClick={onVoiceClick}
          isLoading={isLoading}
          placeholder="Ask anything...."
        />
      )}
    </div>
  );
};

export default ChatWindowContainer;
