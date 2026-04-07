import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout/Layout';
import AnimatedPage from './components/Layout/AnimatedPage';

// Pages
import Home from './pages/Home';
import Heroes from './pages/Heroes';
import HeroDetail from './pages/HeroDetail';
import Equipments from './pages/Equipments';
import EquipmentDetail from './pages/EquipmentDetail';
import Badges from './pages/Badges';
import BadgeDetail from './pages/BadgeDetail';
import Runes from './pages/Runes';
import RuneDetail from './pages/RuneDetail';
import Spells from './pages/Spells';
import SpellDetail from './pages/SpellDetail';
import GameModes from './pages/GameModes';
import GameModeDetail from './pages/GameModeDetail';
import NotFound from './pages/NotFound';
import ResponsiveTableDemo from './components/Demo/ResponsiveTableDemo';
import PinkDesignSystem from './components/Demo/PinkDesignSystem';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
        <Route path="/heroes" element={<AnimatedPage><Heroes /></AnimatedPage>} />
        <Route path="/heroes/:heroId" element={<AnimatedPage><HeroDetail /></AnimatedPage>} />
        <Route path="/equipments" element={<AnimatedPage><Equipments /></AnimatedPage>} />
        <Route path="/equipments/:id" element={<AnimatedPage><EquipmentDetail /></AnimatedPage>} />
        <Route path="/badges" element={<AnimatedPage><Badges /></AnimatedPage>} />
        <Route path="/badges/:id" element={<AnimatedPage><BadgeDetail /></AnimatedPage>} />
        <Route path="/runes" element={<AnimatedPage><Runes /></AnimatedPage>} />
        <Route path="/runes/:id" element={<AnimatedPage><RuneDetail /></AnimatedPage>} />
        <Route path="/spells" element={<AnimatedPage><Spells /></AnimatedPage>} />
        <Route path="/spells/:id" element={<AnimatedPage><SpellDetail /></AnimatedPage>} />
        <Route path="/gamemodes" element={<AnimatedPage><GameModes /></AnimatedPage>} />
        <Route path="/gamemodes/:id" element={<AnimatedPage><GameModeDetail /></AnimatedPage>} />
        <Route path="/demo-table" element={<AnimatedPage><ResponsiveTableDemo /></AnimatedPage>} />
        <Route path="/demo-pink" element={<AnimatedPage><PinkDesignSystem /></AnimatedPage>} />
        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </BrowserRouter>
  );
}