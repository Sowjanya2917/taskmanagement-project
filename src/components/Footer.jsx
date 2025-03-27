import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">TaskMaster</h3>
            <p className="text-gray-400 mb-6">
              Simplify task management, enhance team collaboration, and boost productivity with our comprehensive solution.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300">
                <Github size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Pricing
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Testimonials
                </a>
              </li>
              <li>
                <a href="/login" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Login
                </a>
              </li>
              <li>
                <a href="/register" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Sign Up
                </a>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  API Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-indigo-400 transition duration-300 flex items-center">
                  <ArrowRight size={16} className="mr-2" />
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact & Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Contact Us</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <MapPin size={20} className="mr-3 text-indigo-400 mt-1 flex-shrink-0" />
                <span className="text-gray-400">123 Task Street, Productivity City, PC 12345</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-3 text-indigo-400 flex-shrink-0" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-3 text-indigo-400 flex-shrink-0" />
                <span className="text-gray-400">info@taskmaster.com</span>
              </li>
            </ul>
            
            <h3 className="text-lg font-semibold text-white mb-4">Newsletter</h3>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 bg-gray-800 text-white rounded-l-lg focus:outline-none w-full"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg transition duration-300"
              >
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {currentYear} TaskMaster. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-indigo-400 text-sm transition duration-300">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-indigo-400 text-sm transition duration-300">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-indigo-400 text-sm transition duration-300">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;