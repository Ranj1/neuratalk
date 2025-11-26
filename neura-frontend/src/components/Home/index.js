import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogIn, FiUserPlus, FiZap } from "react-icons/fi";
import AuthModal from "../AuthModal";
import styles from "./index.module.css";

const Home = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState([]);

  // Animated conversation data
  const conversation = [
    {
      sender: "user",
      text: "Hello! How can you help me today?",
      timestamp: "Just now"
    },
    {
      sender: "bot",
      text: "Hi there! I'm your AI assistant. I can help you with questions, provide information, have conversations, and assist with various tasks. What would you like to know?",
      timestamp: "Just now"
    },
    {
      sender: "user", 
      text: "Can you explain how voice chat works?",
      timestamp: "Just now"
    },
    {
      sender: "bot",
      text: "Absolutely! Voice chat allows you to speak naturally with me. Just click the microphone button and start talking. I'll listen, understand your message, and respond with both text and voice. It's like having a conversation with a real person!",
      timestamp: "Just now"
    },
    {
      sender: "user",
      text: "That sounds amazing! Let's get started.",
      timestamp: "Just now"
    },
    {
      sender: "bot",
      text: "Perfect! Click the Sign In button below to begin your AI-powered conversation journey. I'm excited to chat with you!",
      timestamp: "Just now"
    }
  ];

  // Animation logic - Much faster and more engaging
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentMessageIndex < conversation.length) {
        const currentMessage = conversation[currentMessageIndex];
        
        // Show typing indicator for shorter time
        setIsTyping(true);
        
        // After short typing delay, add message to displayed messages
        setTimeout(() => {
          setIsTyping(false);
          setDisplayedMessages(prev => [...prev, currentMessage]);
          
          // Move to next message quickly
          setTimeout(() => {
            setCurrentMessageIndex(prev => prev + 1);
          }, 800); // Much shorter display time
        }, 300); // Much shorter typing delay
      } else {
        // Restart conversation after a brief pause
        setTimeout(() => {
          setCurrentMessageIndex(0);
          setDisplayedMessages([]);
        }, 1000);
      }
    }, 1200); // Much faster interval

    return () => clearInterval(interval);
  }, [currentMessageIndex]); // Removed conversation from dependencies since it's static

  const handleAuthClose = (success) => {
    setShowAuthModal(false);
    if (success) {
      setIsLoading(true);
      // Small delay for better UX
      setTimeout(() => {
        navigate("/chat");
      }, 500);
    }
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <FiZap className={styles.badgeIcon} />
            <span>Powered by AI</span>
          </div>
          
          <h1 className={styles.heroTitle}>
            Welcome to <span className={styles.gradientText}>Voice Chat</span>
          </h1>
          
          <p className={styles.heroSubtitle}>
            Experience AI-powered conversations with voice and text. 
            Start meaningful dialogues with our intelligent assistant.
          </p>

          <div className={styles.heroActions}>
            <button 
              onClick={handleSignIn}
              className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner}></div>
              ) : (
                <>
                  <FiLogIn size={20} />
                  Sign In
                </>
              )}
            </button>
            
            <button 
              onClick={handleSignUp}
              className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
            >
              <FiUserPlus size={20} />
              Sign Up
            </button>
          </div>
        </div>

        {/* Animated Chat Visual */}
        <div className={styles.heroVisual}>
          <div className={styles.animatedChatContainer}>
            <div className={styles.chatHeader}>
              <div className={styles.chatAvatar}>
                <FiZap size={20} />
              </div>
              <div className={styles.chatInfo}>
                <h4>AI Assistant</h4>
                <span className={styles.status}>Online</span>
              </div>
            </div>
            
            <div className={styles.animatedChatWindow}>
              <div className={styles.chatMessages1}>
                {displayedMessages.map((msg, index) => (
                  <div key={index} className={`${styles.messageBubble} ${styles[msg.sender]}`}>
                    {/* <div className={styles.messageAvatar}>
                      {msg.sender === 'user' ? (
                        <FiUserPlus size={16} />
                      ) : (
                        <FiZap size={16} />
                      )}
                    </div> */}
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>{msg.text}</div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className={`${styles.messageBubble} ${styles.bot}`}>
                    {/* <div className={styles.messageAvatar}>
                      <FiZap size={16} />
                    </div> */}
                    <div className={styles.messageContent}>
                      <div className={styles.typingIndicator}>
                        <div className={styles.typingDots}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showAuthModal && <AuthModal onClose={handleAuthClose} initialMode={authMode} />}
    </div>
  );
};

export default Home;