import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Admin from './components/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
