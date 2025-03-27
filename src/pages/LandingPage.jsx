import React from 'react';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';

import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Hero />
      <Footer />
    </div>
  );
};

export default LandingPage;