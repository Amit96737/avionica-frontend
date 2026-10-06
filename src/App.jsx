import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ManufacturerManagement from "./components/manufacturer";
import AircraftManagement from "./components/aircraft";
// import AirPortManagement from "./components/airport";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">

        {/* <nav className="app-navigation">
          <Link to="/manufacturer">Manufacturer</Link>
          <Link to="/aircraft">Aircraft</Link>
        </nav> */}

        <section id="center">
          <Routes>
            <Route
              path="/"
              element={<ManufacturerManagement />}
            />

            <Route
              path="/manufacturer"
              element={<ManufacturerManagement />}
            />

            <Route
              path="/aircraft"
              element={<AircraftManagement />}
            />

            {/* <Route
              path="/airport"
              element={<AirPortManagement />}
            /> */}
          </Routes>
        </section>

      </div>
    </BrowserRouter>
  );
}

export default App;