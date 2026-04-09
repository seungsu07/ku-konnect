import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';

import MajorMap from './pages/MajorMap';

const Home = () => <h2>Main Page</h2>;
const Timetable = () => <h2>Timetable Page</h2>;
const Kommunity = () => <h2>Kommunity Page</h2>;
const Study = () => <h2>Study Page</h2>;

const AppContent = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/login' && location.pathname !== '/signup';

  return (
    <>
      {showNavbar && <Navbar/>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/majormap" element={<MajorMap />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/kommunity" element={<Kommunity />} />
        <Route path="/study" element={<Study />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;