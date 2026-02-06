import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Signup({ setUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = signup form, 2 = OTP verification
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");
  const [emailForVerification, setEmailForVerification] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    const { email, password, confirmPassword } = form;
    if (!email) return "Email required";

    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");
    const v = validate();
    if (v) { setErr(v); return; }

    setLoading(true);
    try {
      const name = form.name.trim() || form.email.split("@")[0];
      const url = `${process.env.REACT_APP_API_URL}/api/auth/signup`;
      const res = await axios.post(url, {
        name,
        email: form.email.trim(),
        password: form.password
      });

      const data = res.data;

      // If OTP is returned (email service not configured), show it
      if (data.otp) {
        setSuccess(`OTP: ${data.otp} (Email service not configured - use this code)`);
      } else {
        setSuccess(data.message || "OTP sent to your email!");
      }

      setEmailForVerification(form.email.trim());
      setStep(2);
    } catch (error) {
      console.error("Signup error:", error);
      setErr(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setErr("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const url = `${process.env.REACT_APP_API_URL}/api/auth/verify-otp`;
      const res = await axios.post(url, {
        email: emailForVerification,
        otp: otp.trim()
      });

      const data = res.data;

      // Account created successfully
      const userToStore = data?.user || { email: emailForVerification };
      localStorage.setItem("user", JSON.stringify(userToStore));

      // Update top-level React state
      if (typeof setUser === "function") setUser(userToStore);

      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Verify OTP error:", error);
      setErr(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setErr("");
    setSuccess("");
    setLoading(true);

    try {
      const url = `${process.env.REACT_APP_API_URL}/api/auth/resend-otp`;
      const res = await axios.post(url, {
        email: emailForVerification
      });

      const data = res.data;

      if (data.otp) {
        setSuccess(`New OTP: ${data.otp} (Email service not configured)`);
      } else {
        setSuccess(data.message || "OTP resent to your email!");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setErr(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>{step === 1 ? "Create account" : "Verify Email"}</h2>
        {err && <div style={styles.err}>{err}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleSignup} style={styles.form}>
            <input
              name="name"
              placeholder="Name (optional)"
              value={form.name}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="email"
              type="email"
              placeholder="College email"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password (min 6 characters)"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
              required
              minLength={6}
            />

            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              required
              minLength={6}
            />

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} style={styles.form}>
            <p style={styles.helpText}>
              We've sent a 6-digit verification code to <strong>{emailForVerification}</strong>
            </p>
            <p style={styles.helpText}>
              Please check your email and enter the code below:
            </p>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={styles.otpInput}
              required
              maxLength={6}
              disabled={loading}
            />

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <div style={styles.resendContainer}>
              <button
                type="button"
                onClick={handleResendOTP}
                style={styles.resendBtn}
                disabled={loading}
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setErr("");
                  setSuccess("");
                }}
                style={styles.backBtn}
                disabled={loading}
              >
                Back
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", paddingTop: 60 },
  card: { width: 420, padding: 20, borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ddd" },
  otpInput: {
    padding: 15,
    borderRadius: 6,
    border: "2px solid #2563eb",
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "bold",
  },
  btn: {
    padding: 10,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  err: {
    padding: 10,
    background: "#fee2e2",
    color: "#dc2626",
    borderRadius: 6,
    marginBottom: 8,
    fontSize: 14,
  },
  success: {
    padding: 10,
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 6,
    marginBottom: 8,
    fontSize: 14,
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  resendContainer: {
    display: "flex",
    gap: 10,
    marginTop: 8,
  },
  resendBtn: {
    flex: 1,
    padding: 8,
    background: "#e5e7eb",
    color: "#374151",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  backBtn: {
    flex: 1,
    padding: 8,
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
};
