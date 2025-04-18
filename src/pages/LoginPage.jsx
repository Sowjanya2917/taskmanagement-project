import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { app } from "../firebase"
import { Link } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

export const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Clear auth error when user types
    if (authError) {
      setAuthError('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        // Check if user is an admin by querying Firestore directly
        try {
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
          
          if (userDoc.exists()) {
            const role = userDoc.data().role || 'user';
            console.log("User logged in with role:", role);
            
            // Use React Router navigation instead of window.location
            if (role === 'admin') {
              navigate('/admin/dashboard');
            } else {
              navigate('/dashboard');
            }
          } else {
            console.log("No user document found, creating default user document");
            
            // Create a default user document if none exists
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              email: userCredential.user.email,
              name: userCredential.user.displayName || '',
              role: 'user',
              createdAt: new Date()
            });
            
            navigate('/dashboard');
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          navigate('/dashboard'); // Default to user dashboard
        }
        
      } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific Firebase auth errors
        switch(error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setAuthError('Invalid email or password');
            break;
          case 'auth/too-many-requests':
            setAuthError('Too many failed login attempts. Please try again later');
            break;
          case 'auth/user-disabled':
            setAuthError('This account has been disabled');
            break;
          default:
            setAuthError('Invalid Credentials. Please try again');
        }
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleRememberMeChange = () => {
    setRememberMe(!rememberMe);
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left Half - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
          </div>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
                disabled={loading}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? 
                    <EyeOff className="h-5 w-5 text-gray-400" /> : 
                    <Eye className="h-5 w-5 text-gray-400" />
                  }
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none transition duration-300 flex items-center justify-center ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up now
            </Link>
          </div>
        </div>
      </div>
      
      {/* Right Half - Image */}
      <div className="hidden lg:block lg:w-1/2 bg-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-blue-500 opacity-90"></div>
        <img 
          src="https://img.freepik.com/premium-vector/smiling-cartoon-faceless-man-giving-five-huge-clock-high-productivity-time-management-skills-goal-fulfillment-2d-vector-concept-flat-style-illustration_776652-3045.jpg" 
          alt="Login background" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <h2 className="text-4xl font-bold mb-6 text-center">Welcome Back!</h2>
          <p className="text-xl max-w-md text-center text-blue-100">
            Log in to access your dashboard and continue where you left off.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-md">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm text-center">
              <div className="text-3xl font-bold">1000+</div>
              <div className="text-blue-100 text-sm">Users</div>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm text-center">
              <div className="text-3xl font-bold">10+</div>
              <div className="text-blue-100 text-sm">Features</div>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm text-center">
              <div className="text-3xl font-bold">99%</div>
              <div className="text-blue-100 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};