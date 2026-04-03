import Konnect_logo from './assets/logo.svg' 
import './App.css'

function App() {

  return (
    <div className="app-container">
      <header className="app-header">
        <img src={Konnect_logo} className="app-logo" alt="React logo" />
        <h1 className="app-title">Konnect 학업 설계 플랫폼</h1>
        
        <p className="app-subtitle">
          연대바보
        </p>
      </header>
    </div>
  )
}

export default App