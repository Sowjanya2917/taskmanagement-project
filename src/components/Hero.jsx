import React from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Hero = () => {
    const { currentUser } = useAuth();
    
    return (
        <div className="bg-gradient-to-r from-indigo-100 to-blue-50 py-20">
            <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-6">
                <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
                    {/* Left Content */}
                    <div className="md:w-1/2 lg:w-5/12">
                        <h1 className="text-4xl font-bold text-gray-900 md:text-5xl lg:text-6xl mb-6">
                            Boost Your <span className="text-indigo-600">Productivity</span> with TaskMaster
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            The all-in-one task management solution designed to help teams collaborate, organize, and accomplish more together.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {currentUser ? (
                                <Link
                                    to="/dashboard"
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-center hover:bg-indigo-700 transition duration-300 font-medium flex items-center justify-center"
                                >
                                    Go to Dashboard
                                    <ChevronRight className="h-5 w-5 ml-1" />
                                </Link>
                            ) : (
                                <Link
                                    to="/register"
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-center hover:bg-indigo-700 transition duration-300 font-medium flex items-center justify-center"
                                >
                                    Get Started for Free
                                    <ChevronRight className="h-5 w-5 ml-1" />
                                </Link>
                            )}
                            <a
                                href="#demo"
                                className="flex items-center justify-center text-indigo-600 px-6 py-3 rounded-lg border border-indigo-600 hover:bg-indigo-50 transition duration-300 font-medium"
                            >
                                <Play className="h-5 w-5 mr-2" strokeWidth={1} />
                                Watch Demo
                            </a>
                        </div>
                        
                        {/* Statistics */}
                        <div className="mt-12 grid grid-cols-3 gap-2 md:gap-6">
                            <div className="text-center p-2 md:p-4">
                                <div className="text-2xl md:text-3xl font-bold text-indigo-600">10k+</div>
                                <div className="text-sm text-gray-600">Active Users</div>
                            </div>
                            <div className="text-center p-2 md:p-4">
                                <div className="text-2xl md:text-3xl font-bold text-indigo-600">250+</div>
                                <div className="text-sm text-gray-600">Companies</div>
                            </div>
                            <div className="text-center p-2 md:p-4">
                                <div className="text-2xl md:text-3xl font-bold text-indigo-600">99.9%</div>
                                <div className="text-sm text-gray-600">Uptime</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Image */}
                    <div className="md:w-1/2 lg:w-7/12 relative">
                        {/* Main Screenshot */}
                        <img
                            src="https://img.freepik.com/free-vector/task-management-abstract-concept-illustration_335657-2127.jpg"
                            alt="TaskMaster Dashboard Preview"
                            className="rounded-xl shadow-xl relative z-10"
                        />
                        
                        {/* Decorative Elements */}
                        <div className="hidden md:block absolute -right-6 -bottom-6 w-64 h-64 bg-indigo-200 rounded-xl z-0"></div>
                        <div className="hidden md:block absolute -left-6 -top-6 w-32 h-32 bg-blue-200 rounded-xl z-0"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;