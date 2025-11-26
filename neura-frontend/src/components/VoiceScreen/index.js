import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMic, FiMicOff, FiX, FiArrowLeft } from "react-icons/fi";
import io from "socket.io-client";
import API from "../../api";
import styles from "./index.module.css";
import MarkdownPreview from "@uiw/react-markdown-preview";

const SOCKET_URL = "process.env.REACT_APP_API_URL";

const VoiceScreenStreaming = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // ---------------------- State & Refs ----------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]); // Array of { sender: 'user' | 'bot', text: string }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);

  const recognitionRef = useRef(null);
  const socketRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const silenceTimeoutRef = useRef(null);
  const lastUserMessageRef = useRef("");
  const isProcessingRef = useRef(false);

  // ---------------------- Authentication Check ----------------------
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

  // ---------------------- Socket.io Initialization ----------------------
  useEffect(() => {
    const socket = io(SOCKET_URL, {
       transports: ["websocket"],
       reconnection: true,
       reconnectionAttempts: 5,
       reconnectionDelay: 1000,
       });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Receive assistant chunks
    socket.on("assistant_chunk", ({ chunk, isFinal }) => {
      // Reset processing flag when bot starts responding
      isProcessingRef.current = false;
      setIsBotThinking(false); // Hide thinking indicator when bot starts responding
      appendTranscript("bot", chunk);
      speakChunk(chunk);

      if (isFinal) socket.emit("assistant_ack_final");
    });

    socket.on("assistant_done", () => {
      console.log("Assistant done, restarting mic...");
      isSpeakingRef.current = false;
      restartRecognition("assistant done");
    });

    socket.on("assistant_error", ({ message }) => {
      setError(message || "Assistant error");
      isSpeakingRef.current = false;
      setIsBotThinking(false); // Hide thinking indicator on error
      window.speechSynthesis.cancel();
      restartRecognition("assistant error");
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  // ---------------------- Speech Recognition Setup ----------------------
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false; // Changed to false to prevent continuous listening
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.serviceURI = undefined; // Use default service

    recognition.onstart = () => {
      console.log("Recognition started");
      setIsRecording(true);
      setError("");
    };

    recognition.onresult = async (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) finalTranscript += text + " ";
        else interimTranscript += text;
      }

      if (interimTranscript) {
        appendTranscript("user", interimTranscript, true);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      }

      if (finalTranscript) {
        const cleanTranscript = finalTranscript.trim();

        if (cleanTranscript.length > 0 &&
            cleanTranscript !== lastUserMessageRef.current &&
            !isProcessingRef.current) {

          lastUserMessageRef.current = cleanTranscript;
          isProcessingRef.current = true;

          appendTranscript("user", cleanTranscript);

          if (socketRef.current?.connected) {
            setIsBotThinking(true); // Show thinking indicator for socket
            socketRef.current.emit("user_message", { sessionId, text: cleanTranscript });
          } else {
            await sendMessageHTTP(cleanTranscript);
          }

          setTimeout(() => {
            isProcessingRef.current = false;
            console.log("Processing flag reset by timeout");
          }, 3000); // Increased to 3 seconds
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access and try again.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      setIsRecording(false);
      if (isRecording && !isSpeakingRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (isRecording && !isSpeakingRef.current && !isProcessingRef.current) {
            try {
              recognition.start();
              setIsRecording(true);
            } catch (err) {
              console.error("Failed to restart recognition:", err);
            }
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sessionId]);

  // ---------------------- Cleanup on Unmount ----------------------
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ---------------------- Helper Functions ----------------------
  const appendTranscript = (sender, text, isInterim = false) => {
    if (isInterim) {
      // Update the last message if it's interim, or add new one
      setTranscript(prev => {
        const newTranscript = [...prev];
        const lastMessage = newTranscript[newTranscript.length - 1];
        
        if (lastMessage && lastMessage.sender === sender && lastMessage.isInterim) {
          newTranscript[newTranscript.length - 1] = { ...lastMessage, text };
        } else {
          newTranscript.push({ sender, text, isInterim: true });
        }
        
        return newTranscript;
      });
    } else {
      // Add final message
      setTranscript(prev => {
        const newTranscript = [...prev];
        // Remove any interim messages from the same sender
        const filteredTranscript = newTranscript.filter(msg => !(msg.sender === sender && msg.isInterim));
        return [...filteredTranscript, { sender, text, isInterim: false }];
      });
    }
  };

  const speakChunk = (text) => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();

      try {
        recognitionRef.current?.stop();
        setIsRecording(false);
      } catch {}

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.volume = 0.8;
      isSpeakingRef.current = true;
      setIsBotThinking(false); // Hide thinking indicator when bot starts speaking

      utter.onend = () => {
        console.log("Bot finished speaking, restarting mic...");
        isSpeakingRef.current = false;
        restartRecognition("bot speech ended");
        resolve();
      };

      utter.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        isSpeakingRef.current = false;
        restartRecognition("speech synthesis error");
        resolve();
      };

      window.speechSynthesis.speak(utter);
    });
  };

  const sendMessageHTTP = async (finalText) => {
    try {
      setIsLoading(true);
      setIsBotThinking(true); // Show thinking indicator
      const res = await API.post(`/chat/${sessionId}/question`, { questionText: finalText });
      const botResp = res.data.answer;
      isProcessingRef.current = false; // Reset processing flag when bot starts responding
      setIsBotThinking(false); // Hide thinking indicator when response arrives
      appendTranscript("bot", botResp);
      await speakChunk(botResp);
    } catch (err) {
      console.error(err);
      setError("Failed to send message");
      setIsBotThinking(false); // Hide thinking indicator on error
      restartRecognition("HTTP error");
    } finally {
      setIsLoading(false);
    }
  };

  const restartRecognition = (reason = "unknown") => {
    console.log(`Restarting recognition: ${reason}`);
    isProcessingRef.current = false; // Force reset processing flag when restarting
    setTimeout(() => {
      if (!isRecording) { // Removed !isProcessingRef.current from condition
        try {
          recognitionRef.current?.start();
          setIsRecording(true);
          console.log("Recognition restarted successfully");
        } catch (err) {
          console.error(`Failed to restart recognition (${reason}):`, err);
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsRecording(true);
              console.log("Recognition restarted on retry");
            } catch (retryErr) {
              console.error(`Retry failed (${reason}):`, retryErr);
            }
          }, 2000);
        }
      } else {
        console.log(`Skipping restart - already recording`); // Updated log
      }
    }, 1500);
  };

  const toggleRecording = () => {
    const recog = recognitionRef.current;
    if (!recog) return;

    if (isRecording) {
      try {
        recog.stop();
        setIsRecording(false);
      } catch (err) {
        console.error("Error stopping recognition:", err);
        setIsRecording(false);
      }
    } else {
      setError("");
      isProcessingRef.current = false;
      lastUserMessageRef.current = "";

      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
      }

      try {
        recog.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error starting recognition:", err);
        setError("Could not start recording");
        setIsRecording(false);
      }
    }
  };

  const handleBack = () => {
    navigate("/chat");
  };

  // Show loading or redirect to home if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={styles.voiceScreen}>
        <div className={styles.loadingScreen}>
          <div className={styles.spinner}></div>
          <p>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.voiceScreen}>
      {/* Header Section */}
      <div className={styles.voiceHeader}>
        <button onClick={handleBack} className={styles.backButton}>
          <FiArrowLeft size={20} />
        </button>
        <h1>{isRecording ? 'Listening...' : 'Voice Conversation'}</h1>
        <div></div> {/* Spacer for centering */}
      </div>

      {/* Center Animation Section */}
      <div className={styles.voiceAnimation}>
        <div className={`${styles.waveformContainer} ${(isRecording || isSpeakingRef.current) ? styles.active : ''}`}>
          <div className={styles.waveformCircle}>
            <div className={styles.waveformInner}>
              <FiMic size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Bot Thinking Indicator */}
      {isBotThinking && (
        <div className={styles.botThinking}>
          <div className={styles.thinkingText}>
            Bot is thinking
            <span className={styles.thinkingDots}>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        </div>
      )}

      {/* Control Buttons Section */}
      <div className={styles.voiceControls}>
        <button
          className={`${styles.micButton} ${isRecording ? styles.recording : ''}`}
          onClick={toggleRecording}
          disabled={isLoading}
        >
          {isRecording ? <FiMicOff size={24} /> : <FiMic size={24} />}
        </button>
        
        <button
          className={styles.cancelButton}
          onClick={() => {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
              setIsRecording(false);
            }
            if (window.speechSynthesis?.speaking) {
              window.speechSynthesis.cancel();
              isSpeakingRef.current = false;
            }
          }}
        >
          <FiX size={24} />
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default VoiceScreenStreaming;
