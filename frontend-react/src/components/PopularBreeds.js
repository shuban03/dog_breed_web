import { useState, useEffect } from "react";

export default function PopularBreeds() {
  const [breeds, setBreeds] = useState([]);
  const [activeGroup, setActiveGroup] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedBreed, setSelectedBreed] = useState(null);

  const groups = ["All", "Sporting", "Working", "Herding", "Hound", "Toy", "Terrier", "Non-Sporting"];

  useEffect(() => {
    fetch("http://127.0.0.1:5001/api/breeds")
      .then((res) => res.json())
      .then((data) => {
        if (data.breeds && data.breeds.length > 0) {
          setBreeds(data.breeds);
        }
      })
      .catch((err) => console.log("Could not fetch breeds:", err));
  }, []);

  const filteredBreeds = breeds.filter((b) => {
    const matchesGroup = activeGroup === "All" || b.akc_group === activeGroup;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.display_name.toLowerCase().includes(q) ||
      (b.temperament && b.temperament.toLowerCase().includes(q)) ||
      (b.origin && b.origin.toLowerCase().includes(q));
    return matchesGroup && matchesSearch;
  });

  const renderPaws = (val) => "🐾".repeat(Math.max(1, Math.min(5, val || 3)));

  return (
    <section className="green-section" style={{ padding: "60px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "35px" }}>
          <h2 style={{ fontSize: "2.2rem", margin: "0 0 10px", color: "white" }}>
            📚 The 120 Canine Dog-o-Pedia
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "1.05rem", margin: 0 }}>
            Explore physical traits, origins, and temperaments of every breed classified by the AI
          </p>
        </div>

        {/* AKC Group Category Tabs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "25px",
          }}
        >
          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => setActiveGroup(grp)}
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                border: "none",
                background: activeGroup === grp ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
                color: activeGroup === grp ? "#2e7d32" : "#ffffff",
                fontWeight: "bold",
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {grp} {grp === "All" ? `(${breeds.length})` : ""}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <div style={{ textAlign: "center", marginBottom: "35px" }}>
          <input
            type="text"
            placeholder="Search by breed, country, or temperament (e.g. Golden, Germany, Playful)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "550px",
              padding: "12px 20px",
              borderRadius: "30px",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              background: "rgba(255, 255, 255, 0.95)",
              color: "#333",
              fontSize: "1rem",
              outline: "none",
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            }}
          />
        </div>

        {/* Breed Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "18px",
            maxHeight: "650px",
            overflowY: "auto",
            padding: "10px",
          }}
        >
          {filteredBreeds.map((b) => (
            <div
              key={b.key}
              onClick={() => setSelectedBreed(b)}
              style={{
                background: "#ffffff",
                color: "#222",
                padding: "20px",
                borderRadius: "14px",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: "#e8f5e9",
                      color: "#1b5e20",
                    }}
                  >
                    {b.akc_group}
                  </span>
                  <span style={{ fontSize: "0.85rem" }}>{b.origin}</span>
                </div>

                <h3 style={{ margin: "10px 0 6px", fontSize: "1.15rem", color: "#111" }}>
                  {b.display_name}
                </h3>

                <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "#666" }}>
                  ⚖️ {b.weight_lbs} | 📏 {b.size}
                </p>

                <p style={{ margin: 0, fontSize: "0.85rem", color: "#444", lineHeight: "1.3" }}>
                  {b.temperament}
                </p>
              </div>

              <div style={{ marginTop: "14px", borderTop: "1px solid #f0f0f0", paddingTop: "8px", fontSize: "0.78rem", color: "#2e7d32", fontWeight: "600", textAlign: "right" }}>
                Click for Vitality Card ➔
              </div>
            </div>
          ))}

          {filteredBreeds.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "white", padding: "40px" }}>
              No breeds found matching your filter.
            </div>
          )}
        </div>

        {/* DETAIL POPUP MODAL */}
        {selectedBreed && (
          <div
            onClick={() => setSelectedBreed(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "20px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                color: "#222",
                padding: "30px",
                borderRadius: "16px",
                maxWidth: "500px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                position: "relative",
              }}
            >
              <button
                onClick={() => setSelectedBreed(null)}
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  border: "none",
                  background: "#eee",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>

              <span
                style={{
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                }}
              >
                🏷️ {selectedBreed.akc_group} Group
              </span>

              <h2 style={{ margin: "10px 0 4px", fontSize: "1.6rem" }}>{selectedBreed.display_name}</h2>
              <p style={{ color: "#666", margin: "0 0 15px", fontSize: "0.9rem" }}>
                🌍 Origin: {selectedBreed.origin} | ⏳ Lifespan: {selectedBreed.life_expectancy}
              </p>

              <p style={{ fontSize: "0.95rem", lineHeight: "1.5", color: "#333", marginBottom: "20px" }}>
                {selectedBreed.description}
              </p>

              {/* Trait Meters */}
              <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px", color: "#1b5e20" }}>Canine Vitality Scorecard</h4>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem" }}>
                  <span>⚡ Energy:</span>
                  <span>{renderPaws(selectedBreed.energy)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem" }}>
                  <span>🎓 Trainability:</span>
                  <span>{renderPaws(selectedBreed.trainability)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem" }}>
                  <span>👶 Kid-Friendly:</span>
                  <span>{renderPaws(selectedBreed.kid_friendly)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem" }}>
                  <span>🏠 Apartment Friendly:</span>
                  <span>{renderPaws(selectedBreed.apartment_friendly)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                  <span>✂️ Grooming Level:</span>
                  <span>{renderPaws(selectedBreed.grooming)}</span>
                </div>
              </div>

              {selectedBreed.fun_fact && (
                <div style={{ background: "#fff8e1", borderLeft: "4px solid #f57f17", padding: "12px", borderRadius: "6px" }}>
                  <strong style={{ color: "#e65100", fontSize: "0.85rem" }}>💡 Fun Fact:</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#444" }}>{selectedBreed.fun_fact}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
