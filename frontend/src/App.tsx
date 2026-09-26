import { Navigate, Route, Routes } from 'react-router-dom'
import CreateTeamPage from './pages/CreateTeamPage'
import ConfirmationPage from './pages/ConfirmationPage'
import WelcomeBackPage from './pages/WelcomeBackPage'
import EditorPage from './pages/EditorPage'
import MinhasJogadasPage from './pages/MinhasJogadasPage'
import AthleteEntryPage from './pages/AthleteEntryPage'
import AthletePlaysPage from './pages/AthletePlaysPage'
import AthletePlayViewerPage from './pages/AthletePlayViewerPage'
import { getChaveTreinador } from './lib/storage'

function RootRoute() {
  if (getChaveTreinador()) {
    return <Navigate to="/times/bem-vindo" replace />
  }
  return <CreateTeamPage />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/times/confirmacao" element={<ConfirmationPage />} />
      <Route path="/times/bem-vindo" element={<WelcomeBackPage />} />
      <Route path="/times/quadra" element={<EditorPage />} />
      <Route path="/times/jogadas" element={<MinhasJogadasPage />} />
      <Route path="/atleta" element={<AthleteEntryPage />} />
      <Route path="/atleta/jogadas" element={<AthletePlaysPage />} />
      <Route path="/atleta/jogadas/:playId" element={<AthletePlayViewerPage />} />
    </Routes>
  )
}

export default App
