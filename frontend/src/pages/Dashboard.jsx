
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  MessageSquare,
  Inbox,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  CalendarDays,
  RefreshCw,
  X,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "reports", label: "My Reports", icon: FileText },
  { id: "claims", label: "My Claims", icon: MessageSquare },
  { id: "received", label: "Claims Received", icon: Inbox },
];

function getList(response, key) {
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
}

function StatusBadge({ status }) {
  const normalized = (status || "Pending").toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`status-badge status-${normalized}`}>
      {status || "Pending"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "Date not available";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [editingReport, setEditingReport] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [reportsResponse, claimsResponse] = await Promise.all([
        api.get("/me/items"),
        api.get("/me/claims"),
      ]);

      const userReports = getList(reportsResponse, "items");
      const submittedClaims = getList(claimsResponse, "claims");

      setReports(userReports);
      setMyClaims(submittedClaims);

      // Load claims received on each of the user's found reports.
      const foundReports = userReports.filter(
        (report) => report.reportType === "found"
      );

      const receivedResults = await Promise.all(
        foundReports.map(async (report) => {
          try {
            const response = await api.get(`/items/${report._id}/claims`);
            return getList(response, "claims").map((claim) => ({
              ...claim,
              reportTitle: report.title,
              reportId: report._id,
            }));
          } catch (err) {
            console.error(
              `Could not load claims for report ${report._id}:`,
              err
            );
            return [];
          }
        })
      );

      setReceivedClaims(receivedResults.flat());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const removeReport = async (reportId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this report?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/items/${reportId}`);
      setActionMessage("Report removed successfully.");
      await loadDashboard();
    } catch (err) {
      setActionMessage(
        err.response?.data?.message || "Could not remove this report."
      );
    }
  };

  const updateClaimStatus = async (claimId, status) => {
    try {
      await api.patch(`/claims/${claimId}`, { status });
      setActionMessage(`Claim ${status.toLowerCase()} successfully.`);
      await loadDashboard();
    } catch (err) {
      setActionMessage(
        err.response?.data?.message || "Could not update this claim."
      );
    }
  };

  const startEditing = (report) => {
    setEditingReport({
      ...report,
      eventDate: report.eventDate
        ? new Date(report.eventDate).toISOString().slice(0, 10)
        : "",
    });
    setActionMessage("");
  };

  const saveReport = async (event) => {
    event.preventDefault();
    if (!editingReport) return;

    setSaving(true);
    setActionMessage("");

    try {
      const {
        _id,
        title,
        category,
        description,
        eventDate,
        locationText,
        imageUrl,
      } = editingReport;

      await api.patch(`/items/${_id}`, {
        title,
        category,
        description,
        eventDate,
        locationText,
        imageUrl,
      });

      setEditingReport(null);
      setActionMessage("Report updated successfully.");
      await loadDashboard();
    } catch (err) {
      setActionMessage(
        err.response?.data?.message || "Could not update your report."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateEditField = (field, value) => {
    setEditingReport((current) => ({
      ...current,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          <RefreshCw className="spin-icon" size={22} />
          <p>Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">YOUR PERSONAL SPACE</p>
          <h1>My Dashboard</h1>
          <p>
            Welcome back, {user?.name || "there"}. Manage your reports and
            track your claims.
          </p>
        </div>

        <Link to="/report" className="dashboard-create-button">
          + Create Report
        </Link>
      </section>

      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <FileText size={22} />
          <div>
            <strong>{reports.length}</strong>
            <span>My Reports</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <MessageSquare size={22} />
          <div>
            <strong>{myClaims.length}</strong>
            <span>Submitted Claims</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <Inbox size={22} />
          <div>
            <strong>{receivedClaims.length}</strong>
            <span>Claims Received</span>
          </div>
        </div>
      </section>

      {error && <div className="dashboard-error">{error}</div>}
      {actionMessage && (
        <div className="dashboard-message">
          {actionMessage}
          <button
            type="button"
            onClick={() => setActionMessage("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <nav className="dashboard-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "active" : ""}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "reports" && (
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>My Lost & Found Reports</h2>
              <p>Reports you have created.</p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="dashboard-empty">
              <FileText size={34} />
              <h3>No reports yet</h3>
              <p>Your lost and found reports will appear here.</p>
              <Link to="/report">Create your first report</Link>
            </div>
          ) : (
            <div className="dashboard-list">
              {reports.map((report) => (
                <article className="dashboard-report-card" key={report._id}>
                  <div className="dashboard-report-main">
                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt={report.title}
                        className="dashboard-report-image"
                      />
                    ) : (
                      <div className="dashboard-report-placeholder">
                        <FileText size={28} />
                      </div>
                    )}

                    <div className="dashboard-report-info">
                      <div className="dashboard-card-tags">
                        <span className={`type-tag ${report.reportType}`}>
                          {report.reportType}
                        </span>
                        <StatusBadge status={report.status} />
                      </div>

                      <h3>{report.title}</h3>
                      <p>{report.category}</p>

                      <div className="dashboard-meta">
                        <span>
                          <MapPin size={14} />
                          {report.locationText}
                        </span>
                        <span>
                          <CalendarDays size={14} />
                          {formatDate(report.eventDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-report-actions">
                    <Link to={`/items/${report._id}`} className="text-action">
                      View
                    </Link>

                    {report.status !== "Removed" && (
                      <>
                        <button
                          type="button"
                          className="text-action"
                          onClick={() => startEditing(report)}
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          type="button"
                          className="text-action danger-action"
                          onClick={() => removeReport(report._id)}
                        >
                          <Trash2 size={15} /> Remove
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "claims" && (
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>My Submitted Claims</h2>
              <p>Track the claims you have submitted.</p>
            </div>
          </div>

          {myClaims.length === 0 ? (
            <div className="dashboard-empty">
              <MessageSquare size={34} />
              <h3>No claims submitted</h3>
              <p>When you submit a claim, it will appear here.</p>
              <Link to="/">Explore found items</Link>
            </div>
          ) : (
            <div className="dashboard-list">
              {myClaims.map((claim) => {
                const item = claim.itemReportId;

                return (
                  <article className="dashboard-claim-card" key={claim._id}>
                    <div>
                      <div className="dashboard-card-tags">
                        <StatusBadge status={claim.status} />
                        {item?.reportType && (
                          <span className="type-tag found">
                            {item.reportType}
                          </span>
                        )}
                      </div>

                      <h3>{item?.title || "Item report"}</h3>
                      <p className="claim-message">{claim.message}</p>

                      <div className="dashboard-meta">
                        <span>
                          <MapPin size={14} />
                          {item?.locationText || "Location unavailable"}
                        </span>
                        <span>
                          <CalendarDays size={14} />
                          Submitted {formatDate(claim.createdAt)}
                        </span>
                      </div>
                    </div>

                    {item?._id && (
                      <Link
                        to={`/items/${item._id}`}
                        className="text-action"
                      >
                        View item
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "received" && (
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Claims Received</h2>
              <p>Review claims submitted on your found reports.</p>
            </div>
          </div>

          {receivedClaims.length === 0 ? (
            <div className="dashboard-empty">
              <Inbox size={34} />
              <h3>No claims received</h3>
              <p>Claims on your found reports will appear here.</p>
            </div>
          ) : (
            <div className="dashboard-list">
              {receivedClaims.map((claim) => (
                <article className="dashboard-claim-card" key={claim._id}>
                  <div>
                    <div className="dashboard-card-tags">
                      <StatusBadge status={claim.status} />
                    </div>

                    <h3>{claim.reportTitle || "Your found report"}</h3>
                    <p className="claim-message">{claim.message}</p>

                    <div className="dashboard-meta">
                      <span>
                        Claimant: {claim.claimantId?.name || "User"}
                      </span>
                      <span>
                        Submitted {formatDate(claim.createdAt)}
                      </span>
                    </div>

                    <Link
                      to={`/items/${claim.reportId}`}
                      className="text-action"
                    >
                      View your report
                    </Link>
                  </div>

                  {claim.status === "Pending" && (
                    <div className="claim-review-actions">
                      <button
                        type="button"
                        className="approve-button"
                        onClick={() =>
                          updateClaimStatus(claim._id, "Approved")
                        }
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        type="button"
                        className="reject-button"
                        onClick={() =>
                          updateClaimStatus(claim._id, "Rejected")
                        }
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {editingReport && (
        <div className="edit-modal-backdrop">
          <form className="edit-report-modal" onSubmit={saveReport}>
            <div className="edit-modal-heading">
              <div>
                <p className="dashboard-eyebrow">UPDATE YOUR LISTING</p>
                <h2>Edit Report</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                aria-label="Close edit form"
              >
                <X size={21} />
              </button>
            </div>

            <label>
              Title
              <input
                required
                minLength={3}
                maxLength={120}
                value={editingReport.title || ""}
                onChange={(e) => updateEditField("title", e.target.value)}
              />
            </label>

            <label>
              Category
              <input
                required
                value={editingReport.category || ""}
                onChange={(e) => updateEditField("category", e.target.value)}
              />
            </label>

            <label>
              Description
              <textarea
                required
                rows={4}
                value={editingReport.description || ""}
                onChange={(e) =>
                  updateEditField("description", e.target.value)
                }
              />
            </label>

            <label>
              Date
              <input
                type="date"
                required
                value={editingReport.eventDate || ""}
                onChange={(e) =>
                  updateEditField("eventDate", e.target.value)
                }
              />
            </label>

            <label>
              Location
              <input
                required
                value={editingReport.locationText || ""}
                onChange={(e) =>
                  updateEditField("locationText", e.target.value)
                }
              />
            </label>

            <label>
              Image URL (optional)
              <input
                type="url"
                value={editingReport.imageUrl || ""}
                onChange={(e) => updateEditField("imageUrl", e.target.value)}
              />
            </label>

            <div className="edit-modal-actions">
              <button
                type="button"
                className="cancel-edit-button"
                onClick={() => setEditingReport(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-edit-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
