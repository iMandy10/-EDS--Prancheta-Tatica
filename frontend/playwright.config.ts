import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// O E2E sobe backend e frontend em portas próprias (8001 e 5174),
// para não brigar com o ambiente de desenvolvimento (8000 e 5173).
const BACKEND_PORT = 8001
const FRONTEND_PORT = 5174

// O caminho do Python da .venv muda entre Windows e Linux/Mac.
const python =
  process.platform === 'win32'
    ? path.join('.venv', 'Scripts', 'python.exe')
    : path.join('.venv', 'bin', 'python')

// Apaga o banco do E2E antes de subir o backend: cada execução começa do zero.
const apagarBanco = `${python} -c "import pathlib; pathlib.Path('e2e.db').unlink(missing_ok=True)"`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `${apagarBanco} && ${python} -m uvicorn app.main:app --port ${BACKEND_PORT}`,
      cwd: path.join(import.meta.dirname, '..', 'backend'),
      env: { DATABASE_URL: 'sqlite:///./e2e.db' },
      url: `http://127.0.0.1:${BACKEND_PORT}/docs`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      env: { VITE_API_URL: `http://localhost:${BACKEND_PORT}` },
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
