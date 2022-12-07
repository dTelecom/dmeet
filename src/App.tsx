import React from 'react';
import './styles/global.css';
import {
  BrowserRouter,
  Route,
  Routes
} from "react-router-dom";
import Home from "./pages/Home/Home";
import Room from "./pages/Room/Room";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home/>}
        />
        <Route
          path="/rooms/:roomName"
          element={<Room/>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
