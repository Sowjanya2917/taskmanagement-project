// import React, { useState } from 'react';
// import { Menu, X, LogOut, Bell, User, Mail } from 'lucide-react';
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from '../contexts/AuthContext'

// const Navbar = () => {
//     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//     const { currentUser, signOut } = useAuth();
//     const navigate = useNavigate();
    
//     const toggleMobileMenu = () => {
//         setMobileMenuOpen(!mobileMenuOpen);
//     };
    
//     const handleSignOut = async () => {
//         try {
//             await signOut();
//             navigate('/login');
//         } catch (error) {
//             console.error('Error signing out:', error);
//         }
//     };
    
//     return (
//         <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
//             <div className="max-w-7xl mx-auto flex justify-between items-center">
//                 {/* Logo */}
//                 <div className="flex items-center">
//                     <Link to="/" className="text-indigo-600 font-bold text-2xl">TaskMaster</Link>
//                 </div>
                
//                 {/* Desktop Navigation */}
//                 <div className="hidden md:flex space-x-8">
//                     <Link to="/notifications" className="text-gray-700 hover:text-indigo-600 transition duration-300 flex items-center">
//                         <Bell className="h-4 w-4 mr-1" />
//                         Notifications
//                     </Link>
//                     <Link to="/contact" className="text-gray-700 hover:text-indigo-600 transition duration-300 flex items-center">
//                         <Mail className="h-4 w-4 mr-1" />
//                         Contact Us
//                     </Link>
//                     <Link to="/profile" className="text-gray-700 hover:text-indigo-600 transition duration-300 flex items-center">
//                         <User className="h-4 w-4 mr-1" />
//                         Profile
//                     </Link>
//                 </div>
                
//                 {/* Auth Buttons */}
//                 <div className="hidden md:flex items-center space-x-4">
//                     {currentUser ? (
//                         <button
//                             onClick={handleSignOut}
//                             className="flex items-center text-gray-700 hover:text-indigo-600 transition duration-300"
//                         >
//                             <LogOut className="h-5 w-5 mr-1" />
//                             Sign Out
//                         </button>
//                     ) : (
//                         <>
//                             <Link to="/login" className="text-indigo-600 hover:text-indigo-800 transition duration-300">Login</Link>
//                             <Link
//                                 to="/register"
//                                 className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
//                             >
//                                 Sign Up Free
//                             </Link>
//                         </>
//                     )}
//                 </div>
                
//                 {/* Mobile Menu Button */}
//                 <div className="md:hidden">
//                     <button
//                         onClick={toggleMobileMenu}
//                         className="text-gray-700 hover:text-indigo-600 focus:outline-none"
//                     >
//                         {mobileMenuOpen ? 
//                             <X className="h-6 w-6" /> : 
//                             <Menu className="h-6 w-6" />
//                         }
//                     </button>
//                 </div>
//             </div>
            
//             {/* Mobile Menu */}
//             {mobileMenuOpen && (
//                 <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md py-4 px-6 z-50">
//                     <div className="flex flex-col space-y-4">
//                         <Link
//                             to="/notifications"
//                             className="text-gray-700 hover:text-indigo-600 py-2 flex items-center"
//                             onClick={toggleMobileMenu}
//                         >
//                             <Bell className="h-4 w-4 mr-2" />
//                             Notifications
//                         </Link>
//                         <Link
//                             to="/contact"
//                             className="text-gray-700 hover:text-indigo-600 py-2 flex items-center"
//                             onClick={toggleMobileMenu}
//                         >
//                             <Mail className="h-4 w-4 mr-2" />
//                             Contact Us
//                         </Link>
//                         <Link
//                             to="/profile"
//                             className="text-gray-700 hover:text-indigo-600 py-2 flex items-center"
//                             onClick={toggleMobileMenu}
//                         >
//                             <User className="h-4 w-4 mr-2" />
//                             Profile
//                         </Link>
                        
//                         <div className="pt-2 border-t border-gray-200 flex flex-col space-y-4">
//                             {currentUser ? (
//                                 <button
//                                     onClick={() => {
//                                         handleSignOut();
//                                         toggleMobileMenu();
//                                     }}
//                                     className="flex items-center text-gray-700 hover:text-indigo-600 py-2"
//                                 >
//                                     <LogOut className="h-5 w-5 mr-1" />
//                                     Sign Out
//                                 </button>
//                             ) : (
//                                 <>
//                                     <Link
//                                         to="/login"
//                                         className="text-indigo-600 hover:text-indigo-800 py-2"
//                                         onClick={toggleMobileMenu}
//                                     >
//                                         Login
//                                     </Link>
//                                     <Link
//                                         to="/register"
//                                         className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 text-center"
//                                         onClick={toggleMobileMenu}
//                                     >
//                                         Sign Up Free
//                                     </Link>
//                                 </>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </nav>
//     );
// };

// export default Navbar;
import React, { useState } from 'react';
import { Menu, X, LogOut, Bell, User, Mail } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import NotificationIndicator from './NotificationIndicator';

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();
    
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };
    
    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };
    
    return (
        <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center">
                    <Link to="/" className="text-indigo-600 font-bold text-2xl">TaskMaster</Link>
                </div>
                
                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-8">
                    {currentUser && (
                        <NotificationIndicator />
                    )}
                    <Link to="/contact" className="text-gray-700 hover:text-indigo-600 transition duration-300 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        Contact Us
                    </Link>
                    <Link to="/profile" className="text-gray-700 hover:text-indigo-600 transition duration-300 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Profile
                    </Link>
                </div>
                
                {/* Auth Buttons */}
                <div className="hidden md:flex items-center space-x-4">
                    {currentUser ? (
                        <button
                            onClick={handleSignOut}
                            className="flex items-center text-gray-700 hover:text-indigo-600 transition duration-300"
                        >
                            <LogOut className="h-5 w-5 mr-1" />
                            Sign Out
                        </button>
                    ) : (
                        <>
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 transition duration-300">Login</Link>
                            <Link
                                to="/register"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
                            >
                                Sign Up Free
                            </Link>
                        </>
                    )}
                </div>
                
                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                    {currentUser && (
                        <NotificationIndicator />
                    )}
                    <button
                        onClick={toggleMobileMenu}
                        className="ml-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
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
                            to="/notifications"
                            className="text-gray-700 hover:text-indigo-600 py-2 flex items-center"
                            onClick={toggleMobileMenu}
                        >
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                        </Link>
                        <Link
                            to="/contact"
                            className="text-gray-700 hover:text-indigo-600 py-2 flex items-center"
                            onClick={toggleMobileMenu}
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Contact Us
                        </Link>
                        <Link
                            to="/profile"
                            className="text-gray-700 hover:text-indigo-600 py-2 flex items-center"
                            onClick={toggleMobileMenu}
                        >
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </Link>
                        
                        <div className="pt-2 border-t border-gray-200 flex flex-col space-y-4">
                            {currentUser ? (
                                <button
                                    onClick={() => {
                                        handleSignOut();
                                        toggleMobileMenu();
                                    }}
                                    className="flex items-center text-gray-700 hover:text-indigo-600 py-2"
                                >
                                    <LogOut className="h-5 w-5 mr-1" />
                                    Sign Out
                                </button>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-indigo-600 hover:text-indigo-800 py-2"
                                        onClick={toggleMobileMenu}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 text-center"
                                        onClick={toggleMobileMenu}
                                    >
                                        Sign Up Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;