import { CssBaseline, ThemeProvider } from '@mui/material'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { EquipmentsPage } from './pages/EquipmentsPage'
import { NewChecklistPage } from './pages/NewChecklistPage'
import { ChecklistHistoryPage } from './pages/ChecklistHistoryPage'
import { NonConformitiesPage } from './pages/NonConformitiesPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { FrentesServicoPage } from './pages/FrentesServicoPage'
import { DatabaseSetupPage } from './pages/DatabaseSetupPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { appTheme } from './styles/theme'
import './styles/global.css'

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/equipamentos" element={<EquipmentsPage />} />
            <Route path="/novo-checklist" element={<NewChecklistPage />} />
            <Route path="/historico" element={<ChecklistHistoryPage />} />
            <Route path="/nao-conformidades" element={<NonConformitiesPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            <Route path="/frentes-servico" element={<FrentesServicoPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/database" element={<DatabaseSetupPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
