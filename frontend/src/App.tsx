import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Signup from './pages/Signup';

import MajorMap from './pages/MajorMap';
import Timetable from './pages/Timetable';
import PostDetail from './pages/PostDetail';

import Home from './pages/Home';

import Kommunity from './pages/Kommunity';
const Study = () => <h2>Study Page</h2>;

const AppContent = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/login' && location.pathname !== '/signup';
  const showFooter = showNavbar && location.pathname !== '/kommunity';

  return (
    <>
      {showNavbar && <Navbar/>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/majormap" element={<MajorMap />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/kommunity" element={<Kommunity />} />
        <Route path="/kommunity/post/:postId" element={<PostDetail />} />
        <Route path="/study" element={<Study />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
      {showFooter && <Footer />}
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