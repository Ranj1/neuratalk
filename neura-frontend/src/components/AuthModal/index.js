import React, { useState } from "react";
import { FiX, FiUser, FiMail, FiLock, FiLogIn, FiUserPlus } from "react-icons/fi";
import API from "../../api";
import styles from "./index.module.css";

const AuthModal = ({onClose, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

   //if (!isOpen) return null; // ✅ modal only shows when open

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password || (!isLogin && !username)) {
      setError("Please fill all fields.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email, password } : { username, email, password };
      const res = await API.post(endpoint, payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onClose(true); // success
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  return (
    <div className={styles.authModalOverlay}>
      <div className={styles.authModal}>
        <button
          onClick={() => onClose(false)}
          className={styles.closeButton}
          aria-label="Close modal"
        >
          <FiX size={16} />
        </button>

        <div className={styles.authModalContent}>
          {/* Left side - Auth form */}
          <div className={styles.authFormSection}>
            <div className={styles.authIllustration}>
              <div className={styles.illustrationCircle}>
                <FiUser size={48} />
              </div>
              <h2>{isLogin ? "Welcome Back!" : "Create an Account"}</h2>
              <p>{isLogin ? "Sign in to continue to Voice Chat" : "Join us to start your voice chat experience"}</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.authForm}>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className={styles.formGroup}>
                  <div className={styles.inputIcon}>
                    <FiUser size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <div className={styles.inputIcon}>
                  <FiMail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.inputIcon}>
                  <FiLock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {isLogin && (
                <div className={styles.forgotPassword}>
                  <button type="button" className={styles.textButton}>
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? (
                  <div className={styles.spinner}></div>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className={styles.authFooter}>
              <span>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  className={`${styles.textButton} ${styles.authFooterTextButton}`}
                  onClick={toggleAuthMode}
                  disabled={loading}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;