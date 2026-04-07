import { Menu, X } from 'lucide-react';
import Navbar from './Navbar';

export default function MobileNav({ sidebarOpen, setSidebarOpen }) {
    return (
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
    );
}