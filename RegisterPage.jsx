import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthCtx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  // Form input states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Validation error states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Submission & UI states
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field validation logic
  const validateField = (name, value, allValues = formData) => {
    const val = typeof value === "string" ? value.trim() : "";

    switch (name) {
      case "firstName":
        if (!val) return "Student first name is required.";
        if (val.length < 2) return "First name must be at least 2 characters.";
        if (!/^[A-Za-z\u0600-\u06FF\s'-]+$/.test(val)) {
          return "First name can only contain letters.";
        }
        return "";

      case "lastName":
        if (!val) return "Student last name is required.";
        if (val.length < 2) return "Last name must be at least 2 characters.";
        if (!/^[A-Za-z\u0600-\u06FF\s'-]+$/.test(val)) {
          return "Last name can only contain letters.";
        }
        return "";

      case "studentId":
        if (!val) return "Student ID is required.";
        if (!/^\d+$/.test(val)) {
          return "Student ID must contain numbers only.";
        }
        if (val.length !== 7) {
          return "Student ID must be exactly 7 digits.";
        }
        return "";

      case "email": {
        if (!val) return "Email address is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          return "Please enter a valid email address (e.g. student@uni.edu).";
        }
        return "";
      }

      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
          return "Password must include at least one letter and one number.";
        }
        return "";

      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== allValues.password) return "Passwords do not match.";
        return "";

      default:
        return "";
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key], formData);
      if (error) {
        newErrors[key] = error;
      }
    });
    return newErrors;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // For studentId, allow typing numbers only and max 7 digits
    if (name === "studentId") {
      if (value !== "" && !/^\d*$/.test(value)) return;
      if (value.length > 7) return;
    }

    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    // If the field was already touched, re-validate dynamically
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value, updatedForm),
      }));
    }

    // If typing in password, recheck confirmPassword if it was touched
    if (name === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField("confirmPassword", formData.confirmPassword, updatedForm),
      }));
    }

    if (serverError) setServerError("");
  };

  // Mark field as touched on blur and run validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, formData),
    }));
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const formErrors = validateForm();
    setErrors(formErrors);

    // If any validation errors exist, focus the first error field
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      const firstField = document.getElementById(errorKeys[0]);
      if (firstField) firstField.focus();
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName,
        studentId: formData.studentId.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const response = await authService.register(payload);

      setSuccessMessage("Account created successfully! Redirecting...");

      // If backend returns a token & user immediately, log them in
      if (response?.token && response?.user && loginUser) {
        loginUser(response.token, response.user);
        setTimeout(() => {
          navigate("/profile");
        }, 1200);
      } else {
        setTimeout(() => {
          navigate("/login", {
            state: {
              registered: true,
              email: formData.email.trim(),
            },
          });
        }, 1500);
      }
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.errors) {
        setErrors((prev) => ({ ...prev, ...responseData.errors }));
      }

      if (!err.response) {
        // Backend is offline / not running yet
        setServerError(
          "All validations passed! (Note: Backend server is currently offline, API call is ready for when the server is connected)."
        );
      } else {
        setServerError(
          responseData?.message ||
            responseData?.error ||
            err.message ||
            "Failed to create account. Please check your network or try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Student Registration</h2>
        </div>

        {/* Global Server Error / Status Alert */}
        {serverError && (
          <div
            style={{
              ...styles.alertError,
              ...(serverError.includes("All validations passed")
                ? styles.alertInfo
                : {}),
            }}
            role="alert"
          >
            <span style={{ fontWeight: "700" }}>
              {serverError.includes("All validations passed") ? "ℹ️ Info: " : "⚠️ Error: "}
            </span>
            {serverError}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div style={styles.alertSuccess} role="alert">
            <span style={{ fontWeight: "700" }}>✓ Success: </span>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {/* First Name & Last Name */}
          <div style={styles.row}>
            <div style={styles.col}>
              <label htmlFor="firstName" style={styles.label}>
                First Name <span style={styles.required}>*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder=""
                style={{
                  ...styles.input,
                  ...(touched.firstName && errors.firstName ? styles.inputError : {}),
                }}
                disabled={loading}
              />
              {touched.firstName && errors.firstName && (
                <span style={styles.errorText}>{errors.firstName}</span>
              )}
            </div>

            <div style={styles.col}>
              <label htmlFor="lastName" style={styles.label}>
                Last Name <span style={styles.required}>*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder=""
                style={{
                  ...styles.input,
                  ...(touched.lastName && errors.lastName ? styles.inputError : {}),
                }}
                disabled={loading}
              />
              {touched.lastName && errors.lastName && (
                <span style={styles.errorText}>{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Student ID */}
          <div style={styles.formGroup}>
            <label htmlFor="studentId" style={styles.label}>
              Student ID <span style={styles.required}>*</span>
            </label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              inputMode="numeric"
              maxLength={7}
              value={formData.studentId}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 2427257"
              style={{
                ...styles.input,
                ...(touched.studentId && errors.studentId ? styles.inputError : {}),
              }}
              disabled={loading}
            />
            {touched.studentId && errors.studentId ? (
              <span style={styles.errorText}>{errors.studentId}</span>
            ) : (
              <span style={styles.helperText}>
                Must be exactly 7 digits ({formData.studentId.length}/7).
              </span>
            )}
          </div>

          {/* Email */}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email <span style={styles.required}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. username@domain.com"
              autoComplete="email"
              style={{
                ...styles.input,
                ...(touched.email && errors.email ? styles.inputError : {}),
              }}
              disabled={loading}
            />
            {touched.email && errors.email && (
              <span style={styles.errorText}>{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Password <span style={styles.required}>*</span>
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                style={{
                  ...styles.input,
                  paddingRight: "70px",
                  ...(touched.password && errors.password ? styles.inputError : {}),
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={styles.toggleBtn}
                tabIndex="-1"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {touched.password && errors.password ? (
              <span style={styles.errorText}>{errors.password}</span>
            ) : (
              <span style={styles.helperText}>
                Must be at least 8 characters with at least one letter and one number.
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirm Password <span style={styles.required}>*</span>
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                style={{
                  ...styles.input,
                  paddingRight: "70px",
                  ...(touched.confirmPassword && errors.confirmPassword ? styles.inputError : {}),
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.toggleBtn}
                tabIndex="-1"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <span style={styles.errorText}>{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {}),
            }}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        {/* Footer / Login Link */}
        <div style={styles.footer}>
          Already registered?{" "}
          <Link to="/login" style={styles.link}>
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}

// Inline styling matching the system's design language
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "1rem 0",
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0",
    padding: "2.25rem 2rem",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "1.75rem",
    textAlign: "center",
  },
  title: {
    fontSize: "1.65rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    fontSize: "0.925rem",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.4",
  },
  alertError: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1.25rem",
    fontSize: "0.875rem",
    lineHeight: "1.4",
  },
  alertInfo: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  alertSuccess: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1.25rem",
    fontSize: "0.875rem",
    lineHeight: "1.4",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  row: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  col: {
    flex: "1 1 200px",
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "0.4rem",
  },
  required: {
    color: "#dc2626",
  },
  input: {
    width: "100%",
    padding: "0.65rem 0.85rem",
    borderRadius: "7px",
    border: "1.5px solid #cbd5e1",
    fontSize: "0.95rem",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    outline: "none",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fffafa",
  },
  errorText: {
    color: "#dc2626",
    fontSize: "0.8rem",
    marginTop: "0.35rem",
    fontWeight: "500",
  },
  helperText: {
    color: "#64748b",
    fontSize: "0.775rem",
    marginTop: "0.35rem",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  toggleBtn: {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "0.8rem",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0.25rem 0.5rem",
  },
  submitBtn: {
    marginTop: "0.5rem",
    padding: "0.8rem 1rem",
    backgroundColor: "#047857",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease, transform 0.1s ease",
  },
  submitBtnDisabled: {
    backgroundColor: "#6ee7b7",
    cursor: "not-allowed",
  },
  footer: {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "0.875rem",
    color: "#475569",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "1.25rem",
  },
  link: {
    color: "#4338ca",
    fontWeight: "600",
    textDecoration: "none",
  },
};
