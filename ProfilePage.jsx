
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthCtx";
import { authService } from "../services/authService";

export default function ProfilePage() {
  const { user, setUser, loading, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Load real user data when available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!user) return;

    setSaving(true);
    setError("");

    try {
      const response = await authService.updateProfile(formData);
      const data = response.data || response;
      const updatedUser = data.user || data;

      setUser(updatedUser);
      setEditing(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading profile...</p>;
  }

  // Generic preview when no student is logged in
  const currentUser = user || {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studentId: "",
    faculty: "",
    department: "",
    academicYear: "",
  };

  const fullName =
    [currentUser.firstName, currentUser.lastName]
      .filter(Boolean)
      .join(" ") || "Student Name";

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>UniPortal</h2>
        <p style={styles.sideTitle}>STUDENT PORTAL</p>

        <div style={styles.activeItem}>
          ▣ &nbsp; My Profile
        </div>

        {user && (
          <button onClick={handleLogout} style={styles.logout}>
            ↪ &nbsp; Logout
          </button>
        )}
      </aside>

      <main style={styles.content}>
        <div style={styles.top}>
          <div>
            <h1 style={styles.heading}>My Profile</h1>
            <p style={styles.subheading}>
              Manage your personal and academic information
            </p>
          </div>

          <span style={styles.badge}>Student Account</span>
        </div>

        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {(currentUser.firstName || "S").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 style={styles.name}>{fullName}</h2>
            <p style={styles.email}>
              {currentUser.email || "Student Email"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Personal Information</h3>

              {user && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={styles.editButton}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div style={styles.grid}>
              <div>
                <label style={styles.label}>First Name</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Student First Name"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Last Name</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Student Last Name"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Student Email"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Phone Number</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Student Phone"
                  style={styles.input}
                />
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Academic Information</h3>

            <div style={styles.grid}>
              <div>
                <label style={styles.label}>Student ID</label>
                <input
                  value={currentUser.studentId || ""}
                  placeholder="Student ID"
                  disabled
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Faculty</label>
                <input
                  value={currentUser.faculty || ""}
                  placeholder="Faculty Name"
                  disabled
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Department</label>
                <input
                  value={currentUser.department || ""}
                  placeholder="Department Name"
                  disabled
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Academic Year</label>
                <input
                  value={currentUser.academicYear || ""}
                  placeholder="Academic Year"
                  disabled
                  style={styles.input}
                />
              </div>
            </div>
          </section>

          {error && <p style={styles.error}>{error}</p>}

          {user && editing && (
            <div style={styles.actions}>
              <button
                type="submit"
                disabled={saving}
                style={styles.saveButton}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.email || "",
                    phone: user.phone || "",
                  });
                  setEditing(false);
                  setError("");
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    gap: "25px",
    minHeight: "650px",
    color: "#0f172a",
  },

  sidebar: {
    width: "210px",
    flexShrink: 0,
    backgroundColor: "#064e3b",
    color: "white",
    borderRadius: "12px",
    padding: "25px 15px",
    display: "flex",
    flexDirection: "column",
  },

  logo: {
    margin: "0 0 35px",
    fontSize: "23px",
  },

  sideTitle: {
    color: "#a7f3d0",
    fontSize: "11px",
    letterSpacing: "1px",
    paddingLeft: "10px",
  },

  activeItem: {
    backgroundColor: "#047857",
    padding: "13px 10px",
    borderRadius: "7px",
    fontWeight: "bold",
  },

  logout: {
    marginTop: "auto",
    background: "transparent",
    color: "white",
    border: "1px solid #6ee7b7",
    padding: "11px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "22px",
  },

  heading: {
    margin: 0,
    fontSize: "27px",
  },

  subheading: {
    color: "#64748b",
    marginTop: "7px",
  },

  badge: {
    backgroundColor: "#d1fae5",
    color: "#047857",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "20px",
  },

  avatar: {
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    backgroundColor: "#047857",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "bold",
  },

  name: {
    margin: 0,
    fontSize: "20px",
  },

  email: {
    color: "#64748b",
    margin: "6px 0 0",
  },

  section: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "20px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
  },

  editButton: {
    backgroundColor: "#047857",
    color: "white",
    border: "none",
    borderRadius: "7px",
    padding: "10px 14px",
    cursor: "pointer",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },

  saveButton: {
    backgroundColor: "#047857",
    color: "white",
    border: "none",
    borderRadius: "7px",
    padding: "12px 20px",
    cursor: "pointer",
  },

  cancelButton: {
    backgroundColor: "#e2e8f0",
    color: "#334155",
    border: "none",
    borderRadius: "7px",
    padding: "12px 20px",
    cursor: "pointer",
  },

  error: {
    color: "#dc2626",
  },
};
