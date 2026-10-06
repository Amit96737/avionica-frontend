import { BrowserRouter, Routes, Route } from "react-router-dom";
import ManufacturerManagement from "./components/manufacturer";
import AircraftManagement from "./components/aircraft";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">

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

          </Routes>
        </section>

      </div>
    </BrowserRouter>
  );
}

export default App;