import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

const Home = () => <h2>Home Page</h2>;
const Majormap = () => <h2>Majormap Page</h2>;
const Timetable = () => <h2>Timetable Page</h2>;
const Kommunity = () => <h2>Kommunity Page</h2>;
const Study = () => <h2>Study Page</h2>;
const Login = () => <h2>Login Page</h2>;

function App() {
  return (
    <BrowserRouter>
    <Navbar/>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/majormap" element={<Majormap />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/kommunity" element={<Kommunity />} />
        <Route path="/study" element={<Study />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;