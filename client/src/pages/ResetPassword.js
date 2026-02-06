// src/pages/ResetPassword.js
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token");

  const [step, setStep] = useState(urlToken ? 2 : 1); // 1 = request token, 2 = reset password
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(urlToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        email: email.trim()
      });

      const data = res.data;

      setSuccess(data.message || "Password reset email sent! Please check your inbox.");

      // If email service is not configured, show token (fallback)
      if (data.resetToken) {
        setToken(data.resetToken);
        setStep(2);
      } else {
        // Email was sent successfully, show success message
        setTimeout(() => {
          setStep(1);
          setEmail("");
        }, 3000);
      }
    } catch (err) {
      console.error("Request token error:", err);
      setError(err.response?.data?.message || "Failed to generate reset token");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
        token: token.trim(),
        newPassword: newPassword,
      });

      const data = res.data;

      setSuccess(data.message || "Password reset successful!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Reset Password</h2>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} style={styles.form}>
            <p style={styles.helpText}>
              Enter your email address to receive a password reset token.
            </p>
            <input
              type="email"
              placeholder="Your college email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Generating token..." : "Get Reset Token"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <p style={styles.helpText}>
              Enter your new password. {!urlToken && "You should have received a reset token in your email."}
            </p>
            {!urlToken && (
              <input
                type="text"
                placeholder="Reset token from email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                style={styles.input}
                disabled={loading}
              />
            )}
            {urlToken && (
              <div style={styles.success}>
                ✅ Reset token detected from email link. Enter your new password below.
              </div>
            )}
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
              minLength={6}
            />
            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setToken("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError("");
                  setSuccess("");
                  navigate("/reset"); // Clear URL token
                }}
                style={styles.secondaryButton}
                disabled={loading}
              >
                Back
              </button>
              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        <p style={styles.link}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "450px",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    background: "#fff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "20px",
  },
  helpText: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "8px",
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    marginTop: "8px",
  },
  secondaryButton: {
    padding: "12px",
    background: "#e5e7eb",
    color: "#374151",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  error: {
    padding: "12px",
    background: "#fee2e2",
    color: "#dc2626",
    borderRadius: "6px",
    marginBottom: "12px",
    fontSize: "14px",
  },
  success: {
    padding: "12px",
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: "6px",
    marginBottom: "12px",
    fontSize: "14px",
  },
  link: {
    textAlign: "center",
    marginTop: "20px",
  },
};

export default ResetPassword;
