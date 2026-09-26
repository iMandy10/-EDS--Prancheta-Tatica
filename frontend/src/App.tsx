import { Route, Routes } from 'react-router-dom'
import CreateTeamPage from './pages/CreateTeamPage'
import ConfirmationPage from './pages/ConfirmationPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateTeamPage />} />
      <Route path="/times/confirmacao" element={<ConfirmationPage />} />
    </Routes>
  )
}

export default App
