import { useState } from "react";
import Hero from "./components/Hero";
import InfoCards from "./components/InfoCards";
import Predictor from "./components/Predictor";
import PopularBreeds from "./components/PopularBreeds";
import Footer from "./components/footer";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      {/* Dark Mode Toggle */}
      <div className="dark-toggle">
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <Hero />
      <InfoCards />
      <Predictor />
      <PopularBreeds />
      <Footer />
    </div>
  );
}

export default App;
