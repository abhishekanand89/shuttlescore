import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import PlayersPage from "./pages/PlayersPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import MatchesPage from "./pages/MatchesPage";
import CreateMatchPage from "./pages/CreateMatchPage";
import LiveScorePage from "./pages/LiveScorePage";
import TournamentsPage from "./pages/TournamentsPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />

          {/* Tournaments */}
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="tournaments/new" element={<CreateTournamentPage />} />
          <Route path="tournaments/:id" element={<TournamentDetailPage />} />

          {/* Matches */}
          <Route path="matches" element={<MatchesPage />} />
          <Route path="/matches/new" element={<CreateMatchPage />} />
          <Route path="/matches/:id" element={<LiveScorePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
