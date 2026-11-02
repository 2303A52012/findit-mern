
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  UserRound,
  Package,
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch item details
  useEffect(() => {
    let active = true;

    const fetchItem = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/items/${id}`);

        if (active) {
          setItem(response.data.item);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to load item details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchItem();

    return () => {
      active = false;
    };
  }, [id]);

  // Submit claim
  const handleClaim = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: `/items/${id}` },
      });
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError("Please provide at least 10 characters explaining your claim.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post(
        `/items/${id}/claims`,
        {
          message: message.trim(),
        }
      );

      setSuccess(
        response.data.message || "Claim submitted successfully!"
      );

      setMessage("");

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to submit your claim."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="details-state">
        <LoaderCircle className="spin" size={32} />
        <p>Loading item details...</p>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="details-state">
        <AlertCircle size={38} />
        <h2>Unable to find this item</h2>
        <p>{error}</p>
        <Link to="/" className="details-back">
          <ArrowLeft size={17} /> Back to Explore
        </Link>
      </div>
    );
  }

  if (!item) return null;

  const isFound = item.reportType === "found";

  const isOwner =
    user &&
    item.ownerId?._id?.toString() === user.id?.toString();

  const isResolved = item.status === "Resolved";
  const isRemoved = item.status === "Removed";

  const eventDate = item.eventDate
    ? new Date(item.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not specified";

  const canClaim =
    isFound &&
    !isOwner &&
    !isResolved &&
    !isRemoved &&
    !success;

  return (
    <main className="details-page">

      <Link to="/" className="details-back">
        <ArrowLeft size={17} />
        Back to Explore
      </Link>

      <div className="details-layout">

        {/* ITEM IMAGE */}
        <section className="details-image-section">

          <div className="details-image">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="details-image-placeholder">
                <Package size={70} />
                <p>No image available</p>
              </div>
            )}

            <span className={`item-badge ${item.reportType}`}>
              {isFound ? "Found Item" : "Lost Item"}
            </span>
          </div>

          <div className="details-safety-note">
            <ShieldCheck size={20} />
            <div>
              <strong>Stay safe while recovering items</strong>
              <p>
                Verify ownership carefully and arrange
                safe public handovers.
              </p>
            </div>
          </div>

        </section>


        {/* ITEM INFORMATION */}
        <section className="details-information">

          <div className="details-category">
            {item.category}
          </div>

          <h1>{item.title}</h1>

          <div className="details-status-row">
            <span className={`status-pill ${item.status === "Resolved" ? "resolved" : item.status === "Removed" ? "removed" : "review"}`}>
              {item.status}
            </span>
          </div>

          <div className="details-description">
            <h3>Item Description</h3>
            <p>{item.description}</p>
          </div>

          <div className="details-info-grid">

            <div className="details-info-card">
              <MapPin size={20} />
              <div>
                <span>Location</span>
                <strong>{item.locationText}</strong>
              </div>
            </div>

            <div className="details-info-card">
              <CalendarDays size={20} />
              <div>
                <span>{isFound ? "Found Date" : "Lost Date"}</span>
                <strong>{eventDate}</strong>
              </div>
            </div>

            <div className="details-info-card">
              <UserRound size={20} />
              <div>
                <span>Reported By</span>
                <strong>{item.ownerId?.name || "FindIt User"}</strong>
              </div>
            </div>

          </div>


          {/* CLAIM SECTION */}
          {canClaim && (
            <div className="claim-box">

              <div>
                <h2>Is this your item?</h2>
                <p>
                  Tell the reporter why you believe this
                  item belongs to you.
                </p>
              </div>

              {!isAuthenticated ? (
                <button
                  className="claim-button"
                  onClick={() =>
                    navigate("/login", {
                      state: { from: `/items/${id}` },
                    })
                  }
                >
                  Login to Claim
                  <ArrowLeft size={17} />
                </button>
              ) : (
                <form onSubmit={handleClaim}>

                  <label htmlFor="claim-message">
                    Explain your ownership
                  </label>

                  <textarea
                    id="claim-message"
                    rows="5"
                    maxLength="1000"
                    placeholder="Describe identifying details that help verify ownership..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />

                  <div className="claim-character-count">
                    {message.length}/1000 characters
                  </div>

                  <button
                    type="submit"
                    className="claim-button"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle className="spin" size={17} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Claim
                        <Send size={17} />
                      </>
                    )}
                  </button>

                </form>
              )}

            </div>
          )}

          {isOwner && (
            <div className="claim-notice">
              You created this report. You cannot claim your own item.
            </div>
          )}

          {!isFound && (
            <div className="claim-notice">
              This is a lost-item report. Claims can only be submitted
              for found items.
            </div>
          )}

          {(isResolved || isRemoved) && (
            <div className="claim-notice">
              This report is {item.status.toLowerCase()} and
              is no longer accepting claims.
            </div>
          )}

          {success && (
            <div className="claim-success">
              <CheckCircle2 size={20} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="claim-error">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}

        </section>

      </div>

    </main>
  );
};

export default ItemDetails;
