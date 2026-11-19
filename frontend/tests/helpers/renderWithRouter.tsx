import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import App from '../../src/App'

// Abre o app inteiro numa rota, com o `state` de navegação opcional (integração).
export function renderApp(rota: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: rota, state }]}>
      <App />
    </MemoryRouter>,
  )
}

// Mostra a rota atual na tela, para o teste conferir para onde o componente navegou.
function RotaAtual() {
  return <output aria-label="rota atual">{useLocation().pathname}</output>
}

// Renderiza um componente sozinho dentro de um Router (unidade), para componentes que usam
// useNavigate ou Link. Depois de navegar, a rota fica em getByLabelText('rota atual').
export function renderWithRouter(ui: ReactElement, rota = '/') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path={rota} element={ui} />
        <Route path="*" element={<RotaAtual />} />
      </Routes>
    </MemoryRouter>,
  )
}
