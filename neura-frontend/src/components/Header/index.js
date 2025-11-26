import React from "react";
import { FiUser } from "react-icons/fi";
import styles from "./index.module.css";

const Header = ({ title = "ChatGPT", onProfileClick }) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerTitle}>
        <h1>{title}</h1>
      </div>
      <div className={styles.headerActions}>
        <button className={styles.profileBtn} onClick={onProfileClick} title="Profile">
          <FiUser size={20} />
        </button>
      </div>
    </div>
  );
};

export default Header;
