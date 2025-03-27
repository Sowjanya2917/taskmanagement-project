    import React, { useState } from 'react';
    import { Menu, X } from 'lucide-react';
    import {Link} from "react-router-dom"

    const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
            <div className="text-indigo-600 font-bold text-2xl">TaskMaster</div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
            <Link to="/solution" className="text-gray-700 hover:text-indigo-600 transition duration-300">Solution</Link>
            <Link to="/notifications" className="text-gray-700 hover:text-indigo-600 transition duration-300">Notifications</Link>
            <Link to="/conatct" className="text-gray-700 hover:text-indigo-600 transition duration-300">Conatct Us</Link>
            <Link to="/profile" className="text-gray-700 hover:text-indigo-600 transition duration-300">Profile</Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 transition duration-300">Login</Link>
            <Link 
                to="/register" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
            >
                Sign Up Free
            </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
            <button 
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
                {mobileMenuOpen ? 
                <X className="h-6 w-6" /> : 
                <Menu className="h-6 w-6" />
                }
            </button>
            </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md py-4 px-6 z-50">
            <div className="flex flex-col space-y-4">
                <Link
                to="/solution" 
                className="text-gray-700 hover:text-indigo-600 py-2"
                onClick={toggleMobileMenu}
                >
                Solution
                </Link>
                
                <div className="pt-2 border-t border-gray-200 flex flex-col space-y-4">
                <a 
                    href="/login" 
                    className="text-indigo-600 hover:text-indigo-800 py-2"
                    onClick={toggleMobileMenu}
                >
                    Login
                </a>
                <a 
                    href="/register" 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 text-center"
                    onClick={toggleMobileMenu}
                >
                    Sign Up Free
                </a>
                </div>
            </div>
            </div>
        )}
        </nav>
    );
    };

    export default Navbar;