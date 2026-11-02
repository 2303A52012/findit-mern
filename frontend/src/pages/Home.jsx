
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  CalendarDays,
  ArrowRight,
  PackageSearch,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";

const LIMIT = 6;

const ItemCard = ({ item }) => {
  const date = item.eventDate
    ? new Date(item.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";

  return (
    <Link to={`/items/${item._id}`} className="item-card">
      <div className="item-image">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="image-placeholder">
            <PackageSearch size={42} />
            <span>No image available</span>
          </div>
        )}

        <span className={`item-badge ${item.reportType}`}>
          {item.reportType === "lost" ? "Lost Item" : "Found Item"}
        </span>
      </div>

      <div className="item-content">
        <span className="item-category">{item.category}</span>

        <h3>{item.title}</h3>

        <p className="item-description">
          {item.description}
        </p>

        <div className="item-meta">
          <span>
            <MapPin size={15} />
            {item.locationText}
          </span>

          <span>
            <CalendarDays size={15} />
            {date}
          </span>
        </div>

        <div className="item-card-footer">
          <span>View details</span>
          <ArrowRight size={17} />
        </div>
      </div>
    </Link>
  );
};


const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>

      <span>
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
};


const Home = () => {
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
  });

  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);

  const [lostPage, setLostPage] = useState(1);
  const [foundPage, setFoundPage] = useState(1);

  const [lostPages, setLostPages] = useState(1);
  const [foundPages, setFoundPages] = useState(1);

  const [lostLoading, setLostLoading] = useState(true);
  const [foundLoading, setFoundLoading] = useState(true);

  const [error, setError] = useState("");

  // Apply search and filters
  const handleSearch = (e) => {
    e.preventDefault();

    setFilters({
      search: searchInput.trim(),
      category: filters.category,
      location: filters.location,
    });

    setLostPage(1);
    setFoundPage(1);
  };

  // Fetch lost and found reports
  useEffect(() => {
    let active = true;

    const fetchItems = async (reportType, page) => {
      const response = await api.get("/items", {
        params: {
          reportType,
          search: filters.search || undefined,
          category: filters.category || undefined,
          location: filters.location || undefined,
          page,
          limit: LIMIT,
        },
      });

      return response.data;
    };

    const loadItems = async () => {
      setError("");
      setLostLoading(true);
      setFoundLoading(true);

      try {
        const [lostResponse, foundResponse] = await Promise.all([
          fetchItems("lost", lostPage),
          fetchItems("found", foundPage),
        ]);

        if (!active) return;

        setLostItems(lostResponse.items || []);
        setFoundItems(foundResponse.items || []);

        setLostPages(lostResponse.totalPages || 1);
        setFoundPages(foundResponse.totalPages || 1);

      } catch (err) {
        if (!active) return;

        console.error("Failed to load items:", err);

        setError(
          err.response?.data?.message ||
          "Unable to load items. Please try again."
        );

        setLostItems([]);
        setFoundItems([]);

      } finally {
        if (active) {
          setLostLoading(false);
          setFoundLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      active = false;
    };
  }, [filters, lostPage, foundPage]);


  const clearFilters = () => {
    setSearchInput("");

    setFilters({
      search: "",
      category: "",
      location: "",
    });

    setLostPage(1);
    setFoundPage(1);
  };


  const renderSection = (
    title,
    subtitle,
    items,
    loading,
    page,
    totalPages,
    setPage,
    type
  ) => (
    <section className="listing-section">

      <div className="section-heading">
        <div>
          <span className={`section-label ${type}`}>
            {type === "lost" ? "NEED HELP FINDING?" : "HELP SOMEONE RECOVER"}
          </span>

          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <span className="listing-count">
          {items.length} shown
        </span>
      </div>

      {loading ? (
        <div className="listing-message">
          <RefreshCw className="spin" size={24} />
          <p>Finding listings...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <PackageSearch size={38} />
          <h3>No {type} items found</h3>
          <p>Try changing your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        </>
      )}

    </section>
  );


  return (
    <main className="home-page">

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">

          <span className="hero-tag">
            <span className="hero-dot"></span>
            YOUR COMMUNITY LOST & FOUND PLATFORM
          </span>

          <h1>
            Lost something?
            <br />
            <span>Let's find it.</span>
          </h1>

          <p>
            Every lost item has a story. FindIt connects people
            with their belongings and turns lost moments into
            happy reunions.
          </p>

          {/* SEARCH */}
          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={21} />

            <input
              type="text"
              placeholder="Search for a wallet, phone, ID card..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <button type="submit">
              Search
            </button>
          </form>

          <div className="hero-links">
            <span>Looking for something?</span>
            <button
              type="button"
              onClick={() => {
                setFilters({ ...filters, search: "" });
                setSearchInput("");
                setLostPage(1);
                setFoundPage(1);
              }}
            >
              Explore all items
            </button>
          </div>

        </div>
      </section>


      {/* FILTER SECTION */}
      <section className="filter-section">
        <div className="filter-heading">
          <SlidersHorizontal size={19} />
          <h3>Refine your search</h3>
        </div>

        <form onSubmit={handleSearch} className="filters-form">

          <div className="filter-input">
            <label>Category</label>
            <input
              type="text"
              placeholder="e.g. Electronics"
              value={filters.category}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  category: e.target.value,
                });
                setLostPage(1);
                setFoundPage(1);
              }}
            />
          </div>

          <div className="filter-input">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g. Warangal"
              value={filters.location}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  location: e.target.value,
                });
                setLostPage(1);
                setFoundPage(1);
              }}
            />
          </div>

          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>

        </form>
      </section>


      {/* ERROR MESSAGE */}
      {error && (
        <div className="home-error">
          <p>{error}</p>
          <button onClick={clearFilters}>Clear filters</button>
        </div>
      )}


      {/* LOST ITEMS */}
      {renderSection(
        "Lost Items",
        "Help someone reunite with their belongings.",
        lostItems,
        lostLoading,
        lostPage,
        lostPages,
        setLostPage,
        "lost"
      )}


      {/* FOUND ITEMS */}
      {renderSection(
        "Found Items",
        "Something found? Help it reach its rightful owner.",
        foundItems,
        foundLoading,
        foundPage,
        foundPages,
        setFoundPage,
        "found"
      )}

      {/* BOTTOM CTA */}
      <section className="home-cta">
        <div>
          <span>BE A PART OF THE SOLUTION</span>
          <h2>Found something? Someone might be looking for it.</h2>
          <p>Share a report and help someone find what they lost.</p>
        </div>

        <Link to="/report">
          Report an Item <ArrowRight size={18} />
        </Link>
      </section>

    </main>
  );
};

export default Home;
