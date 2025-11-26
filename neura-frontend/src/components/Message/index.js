import React from "react";
import { FiUser, FiZap } from "react-icons/fi";
import MarkdownPreview from '@uiw/react-markdown-preview';
import styles from "./index.module.css";

const Message = ({ message, index }) => {
  const { sender, text, timestamp, isInterim = false } = message;
  
  return (
    <div className={`${styles.message} ${styles[sender]} ${isInterim ? styles.interim : ''}`}>
      {/* <div className={styles.messageAvatar}>
        {sender === 'user' ? (
          <FiUser size={16} />
        ) : (
          <FiZap size={16} />
        )}
      </div> */}
      <div className={styles.messageContent}>
        <div className={styles.messageText}>
          {sender === 'bot' ? (
            <MarkdownPreview
              source={text}
              style={{
                backgroundColor: 'transparent',
                color: 'inherit',
                fontSize: 'inherit',
                fontFamily: 'inherit'
              }}
            />
          ) : (
            text
          )}
        </div>
        {timestamp && (
          <div className={styles.messageTimestamp}>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;