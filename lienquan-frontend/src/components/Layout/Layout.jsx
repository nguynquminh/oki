import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileNav from './MobileNav';

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gradient-gaming">
            {/* Mobile Navigation */}
            <div className="lg:hidden">
                <MobileNav
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
            </div>

            <div className="flex">
                {/* Sidebar - Desktop only */}
                <div className="hidden lg:block w-64 fixed h-screen">
                    <Sidebar />
                </div>

                {/* Sidebar - Mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 lg:hidden z-40"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                <div className={`fixed lg:hidden z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } w-64 h-screen`}>
                    <Sidebar />
                </div>

                {/* Main Content */}
                <main className="w-full lg:ml-64 pt-16 lg:pt-0">
                    <div className="container mx-auto px-4 py-6 lg:py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}