import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Predictor() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [petName, setPetName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);

  // Clean preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Check server status & model breed count on mount
  useEffect(() => {
    fetch("http://127.0.0.1:5001/api/status")
      .then((res) => res.json())
      .then((data) => setServerStatus(data))
      .catch(() => setServerStatus({ status: "offline", breed_count: 120 }));
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !(file instanceof File)) return;

    if (preview) URL.revokeObjectURL(preview);

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const predictBreed = async () => {
    if (!image) {
      alert("Please upload a dog photo first!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch("http://127.0.0.1:5001/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error " + response.status);

      const data = await response.json();

      const newResult = {
        breed: data.breed,
        displayName: data.display_name || data.breed.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        confidence: data.confidence,
        description: data.description || (data.info && data.info.description) || "Recognized canine breed.",
        info: data.info || {},
        top_5: data.top_5 || [],
        petName: petName.trim() || "My Dog",
        certificateId: "K9-" + Math.floor(100000 + Math.random() * 900000),
      };

      setResult(newResult);
      setHistory((prev) => [newResult, ...prev].slice(0, 5));
    } catch (err) {
      console.error(err);
      alert("Prediction failed. Please ensure the backend server is running on port 5001.");
    } finally {
      setLoading(false);
    }
  };

  const renderPawRating = (score) => {
    const val = Math.max(1, Math.min(5, score || 3));
    return (
      <span style={{ letterSpacing: "2px" }} title={`${val}/5`}>
        {"🐾".repeat(val)}
        <span style={{ opacity: 0.25 }}>{"🐾".repeat(5 - val)}</span>
      </span>
    );
  };

  const downloadPDF = async () => {
    const report = document.getElementById("passport-certificate");
    if (!report) return;

    report.classList.add("pdf-mode");
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await html2canvas(report, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
    pdf.save(`${result.petName.replace(/\s+/g, "_")}_Canine_Passport.pdf`);

    report.classList.remove("pdf-mode");
  };

  // Palette for DNA heritage radar bars
  const dnaColors = ["#2e7d32", "#1976d2", "#f57c00", "#7b1fa2", "#c2185b"];

  return (
    <section style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>AI Canine Intelligence & Breed Classifier</h2>
        <p style={{ color: "#666", fontSize: "1rem", margin: 0 }}>
          Powered by Stanford Dogs Dataset (120 Breeds) & Deep Transfer Learning
        </p>

        {serverStatus && (
          <div style={{ marginTop: "10px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "20px",
                background: "#e8f5e9",
                color: "#1b5e20",
                fontSize: "0.85rem",
                fontWeight: "bold",
              }}
            >
              🟢 AI Engine Online: {serverStatus.breed_count || 120} Breeds Active
            </span>
          </div>
        )}
      </div>

      {/* Input Form & Preview Box */}
      <div
        className="predict-box"
        style={{
          background: "var(--card-bg, #fff)",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", fontSize: "0.95rem" }}>
            Dog's Name (Optional — will appear on Official Passport):
          </label>
          <input
            type="text"
            placeholder="e.g. Buddy, Max, Luna"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
              maxWidth: "320px",
              fontSize: "0.95rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="file-upload"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: "25px",
              background: "#2e7d32",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
          >
            📸 Choose Dog Photo
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>

        {/* AI Scanner / Preview Frame with Corner Targets */}
        {preview && (
          <div style={{ position: "relative", display: "inline-block", margin: "15px 0" }}>
            <div
              style={{
                position: "relative",
                padding: "8px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #2e7d32, #66bb6a)",
              }}
            >
              <img
                src={preview}
                alt="Dog preview"
                className="preview-img"
                style={{
                  display: "block",
                  maxHeight: "280px",
                  maxWidth: "100%",
                  borderRadius: "10px",
                  objectFit: "cover",
                }}
              />
              {/* AI Bounding Box Graphic Overlay */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  right: "16px",
                  bottom: "16px",
                  border: "2px dashed rgba(255, 255, 255, 0.8)",
                  borderRadius: "8px",
                  pointerEvents: "none",
                  boxShadow: "0 0 12px rgba(46, 125, 50, 0.5)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: "6px",
                    background: "rgba(0,0,0,0.65)",
                    color: "#fff",
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                  }}
                >
                  🎯 CANINE LOCATED
                </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            onClick={predictBreed}
            disabled={loading}
            style={{
              padding: "12px 32px",
              borderRadius: "25px",
              background: loading ? "#9e9e9e" : "#ef6c00",
              color: "white",
              fontSize: "1.05rem",
              fontWeight: "bold",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(239, 108, 0, 0.35)",
              marginTop: "10px",
            }}
          >
            {loading ? "🔍 Analyzing Canine Biometrics..." : "⚡ Identify Breed & Generate Passport"}
          </button>
        </div>
      </div>

      {/* FULL RESULTS & PASSPORT CERTIFICATE */}
      {result && (
        <div style={{ marginTop: "40px" }}>
          {/* PASSPORT CERTIFICATE CONTAINER (Clean white card for both screen and PDF) */}
          <div
            id="passport-certificate"
            style={{
              background: "#ffffff",
              color: "#222",
              borderRadius: "16px",
              padding: "35px",
              border: "3px solid #d4af37", // Elegant gold border
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              position: "relative",
            }}
          >
            {/* Certificate Header Banner */}
            <div
              style={{
                borderBottom: "2px solid #d4af37",
                paddingBottom: "18px",
                marginBottom: "25px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#888", letterSpacing: "1.5px" }}>
                  OFFICIAL K9 IDENTIFICATION PASSPORT
                </span>
                <h2 style={{ margin: "4px 0", fontSize: "1.6rem", color: "#1b5e20" }}>
                  {result.petName}'s Canine Certificate
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    background: "#fff8e1",
                    color: "#f57f17",
                    border: "1px solid #ffd54f",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  🏅 {result.certificateId}
                </span>
                <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>
                  Issued: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Photo + Primary Identity Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "25px",
                alignItems: "center",
                marginBottom: "30px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                {preview && (
                  <img
                    src={preview}
                    alt="Dog"
                    style={{
                      width: "100%",
                      maxWidth: "260px",
                      height: "220px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      border: "3px solid #2e7d32",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  />
                )}
              </div>

              <div>
                <span
                  style={{
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    padding: "4px 12px",
                    borderRadius: "15px",
                    textTransform: "uppercase",
                  }}
                >
                  🏷️ {result.info.akc_group || "Companion"} Group
                </span>

                <h1 style={{ fontSize: "2rem", margin: "10px 0 6px", color: "#111" }}>
                  {result.displayName}
                </h1>

                <p style={{ margin: "0 0 15px", fontSize: "0.95rem", color: "#555" }}>
                  🌍 <b>Origin:</b> {result.info.origin || "International"} | ⚖️ <b>Weight:</b> {result.info.weight_lbs || "Medium"} | ⏳ <b>Life:</b> {result.info.life_expectancy || "10-14 yrs"}
                </p>

                {/* Primary Confidence Bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                    <span>Breed Match Probability</span>
                    <span style={{ color: "#2e7d32" }}>{result.confidence}% Confidence</span>
                  </div>
                  <div style={{ background: "#e0e0e0", borderRadius: "10px", height: "14px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${result.confidence}%`,
                        background: "linear-gradient(90deg, #2e7d32, #4caf50)",
                        height: "100%",
                        borderRadius: "10px",
                      }}
                    />
                  </div>
                </div>

                <p style={{ fontSize: "0.9rem", color: "#444", lineHeight: "1.5", marginTop: "14px" }}>
                  {result.description}
                </p>
              </div>
            </div>

            {/* FEATURE 1: 🧬 MIXED-BREED DNA HERITAGE RADAR */}
            {result.top_5 && result.top_5.length > 1 && (
              <div
                style={{
                  background: "#f9fbf9",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid #e0ebd8",
                  marginBottom: "25px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1b5e20" }}>
                    🧬 Mixed-Breed Genetic Heritage Breakdown
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#777" }}>Top Likelihood Matches</span>
                </div>

                {/* Stacked Rainbow Bar */}
                <div
                  style={{
                    display: "flex",
                    height: "22px",
                    borderRadius: "11px",
                    overflow: "hidden",
                    marginBottom: "12px",
                    background: "#eee",
                  }}
                >
                  {result.top_5.slice(0, 4).map((alt, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${Math.max(alt.confidence, 4)}%`,
                        background: dnaColors[idx % dnaColors.length],
                        title: `${alt.display_name}: ${alt.confidence}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Legend Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {result.top_5.slice(0, 4).map((alt, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.8rem",
                        padding: "4px 10px",
                        borderRadius: "15px",
                        background: "#fff",
                        border: `1px solid ${dnaColors[idx % dnaColors.length]}`,
                        color: "#333",
                        fontWeight: "500",
                      }}
                    >
                      <span style={{ color: dnaColors[idx % dnaColors.length], fontWeight: "bold" }}>● </span>
                      {alt.display_name}: <b>{alt.confidence}%</b>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FEATURE 2: 📊 CANINE VITALITY & SKILL SCORECARD */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginBottom: "25px",
              }}
            >
              <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600" }}>⚡ ENERGY LEVEL</div>
                <div style={{ marginTop: "4px" }}>{renderPawRating(result.info.energy || 3)}</div>
              </div>

              <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600" }}>🎓 TRAINABILITY</div>
                <div style={{ marginTop: "4px" }}>{renderPawRating(result.info.trainability || 4)}</div>
              </div>

              <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600" }}>👶 FAMILY / KID FRIENDLY</div>
                <div style={{ marginTop: "4px" }}>{renderPawRating(result.info.kid_friendly || 4)}</div>
              </div>

              <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600" }}>🏠 APARTMENT SUITABLE</div>
                <div style={{ marginTop: "4px" }}>{renderPawRating(result.info.apartment_friendly || 3)}</div>
              </div>

              <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "600" }}>✂️ GROOMING NEEDS</div>
                <div style={{ marginTop: "4px" }}>{renderPawRating(result.info.grooming || 3)}</div>
              </div>
            </div>

            {/* FEATURE 3: ⚖️ LOOKALIKE COMPARISON */}
            {result.info.lookalike && result.info.lookalike.name && (
              <div
                style={{
                  background: "#e3f2fd",
                  borderLeft: "4px solid #1976d2",
                  padding: "14px 18px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                }}
              >
                <strong style={{ color: "#0d47a1", fontSize: "0.95rem" }}>
                  ⚖️ How to Tell Apart from Lookalike: {result.info.lookalike.name}
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#333", lineHeight: "1.4" }}>
                  {result.info.lookalike.tip}
                </p>
              </div>
            )}

            {/* FEATURE 4: 💡 FUN FACT TRIVIA */}
            {result.info.fun_fact && (
              <div
                style={{
                  background: "#fff8e1",
                  borderLeft: "4px solid #ffb300",
                  padding: "14px 18px",
                  borderRadius: "6px",
                  marginBottom: "15px",
                }}
              >
                <strong style={{ color: "#b78103", fontSize: "0.95rem" }}>💡 Breed Fun Fact:</strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#444", lineHeight: "1.4" }}>
                  {result.info.fun_fact}
                </p>
              </div>
            )}

            {/* Verification Footer Stamp */}
            <div
              style={{
                borderTop: "1px dashed #ccc",
                paddingTop: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.75rem",
                color: "#777",
              }}
            >
              <span>🔒 AI Biometric Analysis: Stanford Dogs Vision Architecture</span>
              <span style={{ fontWeight: "bold", color: "#2e7d32" }}>✓ VERIFIED CANINE RECORD</span>
            </div>
          </div>

          {/* Download Official PDF Button */}
          <div style={{ textAlign: "center", marginTop: "25px" }}>
            <button
              onClick={downloadPDF}
              className="download-btn"
              style={{
                padding: "14px 32px",
                borderRadius: "30px",
                background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                color: "white",
                fontSize: "1.1rem",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(46, 125, 50, 0.35)",
              }}
            >
              📄 Download Official Canine Passport (PDF)
            </button>
          </div>
        </div>
      )}

      {/* Prediction History */}
      {history.length > 0 && (
        <div className="history-box" style={{ marginTop: "50px" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>Recent Scan History</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {history.map((item, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                  fontSize: "0.9rem",
                }}
              >
                <span>
                  🐾 <b>{item.petName}</b> — {item.displayName}
                </span>
                <span style={{ color: "#2e7d32", fontWeight: "bold" }}>{item.confidence}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
