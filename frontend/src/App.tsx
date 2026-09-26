import { Navigate, Route, Routes } from 'react-router-dom'
import CreateTeamPage from './pages/CreateTeamPage'
import ConfirmationPage from './pages/ConfirmationPage'
import WelcomeBackPage from './pages/WelcomeBackPage'
import EditorPage from './pages/EditorPage'
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
    </Routes>
  )
}

export default App
