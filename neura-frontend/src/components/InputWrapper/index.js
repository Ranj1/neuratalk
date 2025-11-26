import React, { useState, useEffect, useRef } from "react";
import { FiMic, FiSend } from "react-icons/fi";
import styles from "./index.module.css";

const InputWrapper = ({ 
  onSendMessage, 
  onVoiceClick,
  isLoading = false,
  placeholder = "Type a message..."
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceClick = () => {
    if (onVoiceClick) {
      onVoiceClick();
    }
  };

  return (
    <div className={styles.inputWrapperContainer}>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className={styles.messageInput}
            rows="1"
            disabled={isLoading}
            style={{ 
              resize: 'none',
              minHeight: '20px',
              maxHeight: '120px',
              overflow: 'hidden'
            }}
          />
          <div className={styles.inputActions}>
          <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || !inputValue.trim()}
              title="Send message"
            >
              <FiSend size={16} />
            </button>
            <button
              type="button"
              className={styles.voiceButton}
              onClick={handleVoiceClick}
              disabled={isLoading}
              title="Voice input"
            >
              <FiMic size={16} />
            </button>  
          </div>
        </div>
      </form>
    </div>
  );
};

export default InputWrapper;
