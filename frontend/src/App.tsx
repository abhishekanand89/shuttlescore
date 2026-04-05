import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import PlayersPage from "./pages/PlayersPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
