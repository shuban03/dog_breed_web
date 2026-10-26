// API Base URL - uses relative path automatically on phones and hosted domains
const API_BASE = window.location.protocol.startsWith("http") ? "" : "http://127.0.0.1:5001";

let allBreeds = [];
let currentFilter = "All";
let currentSearch = "";
let selectedFile = null;
let currentPreviewUrl = null;

const dnaColors = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#db2777"];

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  checkServerStatus();
  setupDropzone();
  loadDogopediaBreeds();
});

function checkServerStatus() {
  fetch(`${API_BASE}/api/status`)
    .then(res => res.json())
    .then(data => {
      const badgeText = document.getElementById("modelStatusText");
      if (badgeText) {
        badgeText.textContent = `🟢 ${data.breed_count || 120} Breeds Online`;
      }
    })
    .catch(() => {
      const badgeText = document.getElementById("modelStatusText");
      if (badgeText) badgeText.textContent = "🟡 Connecting to Backend (5001)...";
    });
}

// Setup Drag & Drop and File Input
function setupDropzone() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("imageInput");
  if (!dropzone || !fileInput) return;

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag-over");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });
}

// Handle Image Selected — Instant In-Place Preview
function handleFileSelected(file) {
  clearPredictError();
  if (!file) return;

  const validExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".jfif"];
  const lowerName = (file.name || "").toLowerCase();
  const hasExt = validExts.some(ext => lowerName.endsWith(ext));
  const hasMime = file.type && file.type.startsWith("image/");

  if (!hasExt && !hasMime) {
    showPredictError("Please choose a valid photo file (JPG, PNG, or WebP).");
    return;
  }

  selectedFile = file;

  // Revoke old blob URL if any
  if (currentPreviewUrl) {
    try { URL.revokeObjectURL(currentPreviewUrl); } catch (e) {}
  }

  // Create immediate Object URL for instant preview
  currentPreviewUrl = URL.createObjectURL(file);

  const previewImg = document.getElementById("imagePreview");
  const filenameEl = document.getElementById("previewFilename");
  const emptyState = document.getElementById("dropzoneEmpty");
  const previewState = document.getElementById("dropzonePreview");

  if (previewImg) previewImg.src = currentPreviewUrl;
  if (filenameEl) filenameEl.textContent = file.name;

  if (emptyState) emptyState.style.display = "none";
  if (previewState) previewState.style.display = "flex";

  // Hide previous results or warnings when a new file is chosen
  const notDogSection = document.getElementById("notDogSection");
  if (notDogSection) notDogSection.style.display = "none";
  const resultSection = document.getElementById("resultSection");
  if (resultSection) resultSection.style.display = "none";
}

// Reset Uploaded Photo
function resetUpload(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  selectedFile = null;
  if (currentPreviewUrl) {
    try { URL.revokeObjectURL(currentPreviewUrl); } catch (e) {}
    currentPreviewUrl = null;
  }

  const fileInput = document.getElementById("imageInput");
  if (fileInput) fileInput.value = "";

  const previewImg = document.getElementById("imagePreview");
  if (previewImg) previewImg.src = "";

  const emptyState = document.getElementById("dropzoneEmpty");
  const previewState = document.getElementById("dropzonePreview");
  if (emptyState) emptyState.style.display = "block";
  if (previewState) previewState.style.display = "none";

  const notDogSection = document.getElementById("notDogSection");
  if (notDogSection) notDogSection.style.display = "none";

  const resultSection = document.getElementById("resultSection");
  if (resultSection) resultSection.style.display = "none";

  clearPredictError();
}

function showPredictError(msg) {
  const errBox = document.getElementById("predictError");
  if (errBox) {
    errBox.innerHTML = `<span>⚠️ ${msg}</span><button type="button" onclick="clearPredictError()" style="background:none;border:none;color:#b91c1c;cursor:pointer;font-weight:bold;font-size:1.1rem;line-height:1;">✕</button>`;
    errBox.style.display = "flex";
  }
}

function clearPredictError() {
  const errBox = document.getElementById("predictError");
  if (errBox) {
    errBox.style.display = "none";
    errBox.innerHTML = "";
  }
}

// Predict Breed Function
function predict() {
  clearPredictError();

  const fileInput = document.getElementById("imageInput");
  if (!selectedFile && fileInput && fileInput.files && fileInput.files[0]) {
    handleFileSelected(fileInput.files[0]);
  }

  if (!selectedFile) {
    showPredictError("Please choose or drop a dog photo first!");
    return;
  }

  const predictBtn = document.getElementById("predictBtn");
  const btnLabel = document.getElementById("btnLabel");
  const btnLoader = document.getElementById("btnLoader");
  const resultSection = document.getElementById("resultSection");
  const notDogSection = document.getElementById("notDogSection");

  // Show button spinner
  predictBtn.disabled = true;
  if (btnLabel) btnLabel.style.display = "none";
  if (btnLoader) btnLoader.style.display = "flex";
  if (resultSection) resultSection.style.display = "none";
  if (notDogSection) notDogSection.style.display = "none";

  const formData = new FormData();
  formData.append("image", selectedFile);

  // 30s abort controller to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  fetch(`${API_BASE}/predict`, {
    method: "POST",
    body: formData,
    signal: controller.signal
  })
  .then(async res => {
    clearTimeout(timeoutId);
    if (!res.ok) {
      let msg = `Server returned status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) msg = errJson.error;
      } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  })
  .then(data => {
    // Check if the uploaded image was recognized as a dog
    if (data.is_dog === false) {
      if (resultSection) resultSection.style.display = "none";
      const notDogMsg = document.getElementById("notDogMessage");
      const detectedObj = document.getElementById("detectedObjectName");
      if (notDogMsg) notDogMsg.textContent = data.error || "No dog was detected in this photo.";
      if (detectedObj) detectedObj.textContent = data.detected_object || "Object / Person";
      if (notDogSection) {
        notDogSection.style.display = "block";
        notDogSection.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    // It's a dog! Render full passport
    if (notDogSection) notDogSection.style.display = "none";
    renderPassportCertificate(data);
    if (resultSection) {
      resultSection.style.display = "block";
      resultSection.scrollIntoView({ behavior: "smooth" });
    }
  })
  .catch(err => {
    console.error("Prediction error:", err);
    let msg = err.message || "Failed to analyze photo. Please verify backend is running.";
    if (err.name === "AbortError") {
      msg = "Request timed out after 30 seconds. Please check your backend connection.";
    } else if (err.message && err.message.includes("Failed to fetch")) {
      msg = "Cannot reach server. Please ensure backend is active.";
    }
    showPredictError(msg);
  })
  .finally(() => {
    clearTimeout(timeoutId);
    predictBtn.disabled = false;
    if (btnLabel) btnLabel.style.display = "inline";
  });
}

// Render Passport Certificate & Vitality Data
function renderPassportCertificate(data) {
  try {
    const petNameInput = document.getElementById("petNameInput");
    const petName = (petNameInput ? petNameInput.value : "").trim() || "My Dog";
    const displayName = data.display_name || (data.breed ? data.breed.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Canine");
    const info = data.info || {};

    // Certificate Header
    const certPet = document.getElementById("certPetName");
    if (certPet) certPet.textContent = `${petName}'s Canine Passport`;

    const certBadge = document.getElementById("certIdBadge");
    if (certBadge) certBadge.textContent = `K9-${Math.floor(100000 + Math.random() * 900000)}`;

    const certDate = document.getElementById("certDate");
    if (certDate) certDate.textContent = `Issued: ${new Date().toLocaleDateString()}`;

    // Dog Photo in Certificate
    const certImage = document.getElementById("certImage");
    if (certImage) {
      certImage.src = currentPreviewUrl || (selectedFile ? URL.createObjectURL(selectedFile) : "");
    }

    // Breed & Group Badge
    const groupBadge = document.getElementById("certGroupBadge");
    if (groupBadge) groupBadge.textContent = `${(info.akc_group || "Companion").toUpperCase()} GROUP`;

    const breedTitle = document.getElementById("certBreedName");
    if (breedTitle) breedTitle.textContent = displayName;

    // Confidence Bar
    const confNum = document.getElementById("certConfidenceNum");
    if (confNum) confNum.textContent = `${data.confidence}%`;

    const confBar = document.getElementById("certConfidenceBar");
    if (confBar) confBar.style.width = `${data.confidence}%`;

    // Specs
    const originEl = document.getElementById("specOrigin");
    if (originEl) originEl.textContent = info.origin || "International 🌍";

    const weightEl = document.getElementById("specWeight");
    if (weightEl) weightEl.textContent = info.weight_lbs || "Medium";

    const lifeEl = document.getElementById("specLife");
    if (lifeEl) lifeEl.textContent = info.life_expectancy || "10 - 14 yrs";

    // Description
    const descEl = document.getElementById("certDescription");
    if (descEl) {
      descEl.textContent = data.description || info.description || `The ${displayName} is a distinguished breed with a rich heritage.`;
    }

    // DNA Mixed Heritage Breakdown
    const stackedBar = document.getElementById("dnaStackedBar");
    const legend = document.getElementById("dnaLegend");
    if (stackedBar && legend) {
      stackedBar.innerHTML = "";
      legend.innerHTML = "";

      const topMatches = (data.top_5 && data.top_5.length > 0)
        ? data.top_5.slice(0, 4)
        : [{ display_name: displayName, confidence: data.confidence }];

      topMatches.forEach((match, idx) => {
        const col = dnaColors[idx % dnaColors.length];

        const seg = document.createElement("div");
        seg.style.width = `${Math.max(match.confidence, 4)}%`;
        seg.style.background = col;
        seg.title = `${match.display_name}: ${match.confidence}%`;
        stackedBar.appendChild(seg);

        const pill = document.createElement("span");
        pill.className = "dna-pill";
        pill.innerHTML = `<span style="color:${col}; font-weight:800;">●</span> ${match.display_name}: <b>${match.confidence}%</b>`;
        legend.appendChild(pill);
      });
    }

    // Vitality Paw Meters
    const vEnergy = document.getElementById("vitalityEnergy");
    if (vEnergy) vEnergy.innerHTML = renderPaws(info.energy || 3);

    const vTrain = document.getElementById("vitalityTrain");
    if (vTrain) vTrain.innerHTML = renderPaws(info.trainability || 4);

    const vKids = document.getElementById("vitalityKids");
    if (vKids) vKids.innerHTML = renderPaws(info.kid_friendly || 4);

    const vApt = document.getElementById("vitalityApt");
    if (vApt) vApt.innerHTML = renderPaws(info.apartment_friendly || 3);

    const vGroom = document.getElementById("vitalityGroom");
    if (vGroom) vGroom.innerHTML = renderPaws(info.grooming || 3);

    // Lookalike Box
    const lookalikeBox = document.getElementById("lookalikeBox");
    const lookalikeTip = document.getElementById("lookalikeTip");
    if (info.lookalike && info.lookalike.name && lookalikeBox && lookalikeTip) {
      lookalikeTip.textContent = `${info.lookalike.name}: ${info.lookalike.tip}`;
      lookalikeBox.style.display = "block";
    } else if (lookalikeBox) {
      lookalikeBox.style.display = "none";
    }

    // Fun Fact Box
    const funFactBox = document.getElementById("funFactBox");
    const funFactText = document.getElementById("funFactText");
    if (info.fun_fact && funFactBox && funFactText) {
      funFactText.textContent = info.fun_fact;
      funFactBox.style.display = "block";
    } else if (funFactBox) {
      funFactBox.style.display = "none";
    }
  } catch (err) {
    console.error("Error rendering passport:", err);
  }
}

function renderPaws(val) {
  const score = Math.max(1, Math.min(5, val || 3));
  return "🐾".repeat(score) + `<span style="opacity:0.25">${"🐾".repeat(5 - score)}</span>`;
}

// Download PDF Function — Device-Independent Crisp A4 Export
async function downloadPassportPDF() {
  const cert = document.getElementById("passportCertificate");
  if (!cert) return;

  const btn = document.querySelector(".pdf-btn");
  const origBtnText = btn ? btn.innerHTML : "📄 Download Official Canine Passport (PDF)";
  if (btn) {
    btn.innerHTML = "⏳ Generating Official Certificate PDF...";
    btn.disabled = true;
  }

  try {
    const petNameInput = document.getElementById("petNameInput");
    const petName = (petNameInput ? petNameInput.value : "").trim() || "Dog";

    // Clone certificate into standard off-screen container so it captures in desktop A4 layout even on phones
    const clone = cert.cloneNode(true);
    clone.classList.add("pdf-capture-container");
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.zIndex = "-1000";
    document.body.appendChild(clone);

    // Wait for fonts and image to be ready
    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: 1024
    });

    document.body.removeChild(clone);

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();   // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const margin = 10;
    const maxWidth = pageWidth - (margin * 2);   // 190 mm
    const maxHeight = pageHeight - (margin * 2); // 277 mm

    // Compute strictly proportional dimensions to avoid any stretch or squash
    let renderWidth = maxWidth;
    let renderHeight = (canvas.height * renderWidth) / canvas.width;

    if (renderHeight > maxHeight) {
      renderHeight = maxHeight;
      renderWidth = (canvas.width * renderHeight) / canvas.height;
    }

    // Horizontally & vertically center within page margins
    const posX = margin + (maxWidth - renderWidth) / 2;
    const posY = margin + (maxHeight - renderHeight) / 2;

    pdf.addImage(imgData, "PNG", posX, posY, renderWidth, renderHeight, "", "FAST");
    pdf.save(`${petName.replace(/\s+/g, "_")}_Canine_Passport.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Could not generate PDF. Please try again.");
  } finally {
    if (btn) {
      btn.innerHTML = origBtnText;
      btn.disabled = false;
    }
  }
}

// Load Dog-o-Pedia Breeds
function loadDogopediaBreeds() {
  fetch(`${API_BASE}/api/breeds`)
    .then(res => res.json())
    .then(data => {
      allBreeds = data.breeds || [];
      renderDogopedia();
    })
    .catch(() => {
      const grid = document.getElementById("breedCardsGrid");
      if (grid) {
        grid.innerHTML = '<div class="loading-catalog">Could not load breed library. Ensure backend is running.</div>';
      }
    });
}

function setGroupFilter(grp) {
  currentFilter = grp;
  document.querySelectorAll(".filter-pills .pill").forEach(p => {
    p.classList.toggle("active", p.textContent.includes(grp));
  });
  renderDogopedia();
}

function handleSearch(val) {
  currentSearch = (val || "").toLowerCase().trim();
  renderDogopedia();
}

function renderDogopedia() {
  const grid = document.getElementById("breedCardsGrid");
  if (!grid) return;

  const filtered = allBreeds.filter(b => {
    const matchesGroup = currentFilter === "All" || b.akc_group === currentFilter;
    const matchesSearch =
      !currentSearch ||
      (b.display_name && b.display_name.toLowerCase().includes(currentSearch)) ||
      (b.temperament && b.temperament.toLowerCase().includes(currentSearch)) ||
      (b.origin && b.origin.toLowerCase().includes(currentSearch));
    return matchesGroup && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="loading-catalog">No matching breeds found. Try another search.</div>';
    return;
  }

  grid.innerHTML = filtered.map(b => `
    <div class="breed-tile" onclick="openBreedModal('${escapeHtml(b.key)}')">
      <div class="tile-group">${escapeHtml(b.akc_group || 'Companion')}</div>
      <div class="tile-name">${escapeHtml(b.display_name)}</div>
      <div class="tile-origin">🌍 ${escapeHtml(b.origin || 'International')}</div>
    </div>
  `).join("");
}

function openBreedModal(key) {
  const breed = allBreeds.find(b => b.key === key);
  if (!breed) return;

  document.getElementById("modalGroup").textContent = `${(breed.akc_group || "Companion").toUpperCase()} GROUP`;
  document.getElementById("modalName").textContent = breed.display_name;
  document.getElementById("modalSub").textContent = `Origin: ${breed.origin || 'International 🌍'}`;
  document.getElementById("modalDesc").textContent = breed.description || "Distinct registered breed.";

  document.getElementById("modalEnergy").innerHTML = renderPaws(breed.energy || 3);
  document.getElementById("modalTrain").innerHTML = renderPaws(breed.trainability || 4);
  document.getElementById("modalKids").innerHTML = renderPaws(breed.kid_friendly || 4);
  document.getElementById("modalApt").innerHTML = renderPaws(breed.apartment_friendly || 3);
  document.getElementById("modalGroom").innerHTML = renderPaws(breed.grooming || 3);

  const factBox = document.getElementById("modalFactBox");
  if (breed.fun_fact) {
    document.getElementById("modalFact").textContent = breed.fun_fact;
    factBox.style.display = "block";
  } else {
    factBox.style.display = "none";
  }

  document.getElementById("detailModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}
