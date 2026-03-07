import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HotspotsPage from './pages/HotspotsPage.jsx'
import KeywordsPage from './pages/KeywordsPage.jsx'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HotspotsPage />} />
          <Route path="/keywords" element={<KeywordsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
