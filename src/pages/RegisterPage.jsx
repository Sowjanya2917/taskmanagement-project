import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { app } from "../firebase"
import { Link } from "react-router-dom"
import { getFirestore, doc, setDoc } from "firebase/firestore";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showAdminOption, setShowAdminOption] = useState(false);
  
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  // Admin secret key (in a real application, this would be handled securely on the server)
  const ADMIN_SECRET_KEY = "admin123"; // This is just for demo purposes
  
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
  
  const toggleAdminOption = () => {
    setShowAdminOption(!showAdminOption);
    // Reset admin key when toggling
    setAdminKey('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    // Check admin key if trying to register as admin
    if (showAdminOption) {
      if (!adminKey) {
        newErrors.adminKey = 'Admin key is required';
      } else if (adminKey !== ADMIN_SECRET_KEY) {
        newErrors.adminKey = 'Invalid admin key';
      }
    }
    
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        // Create user with Firebase
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        // Update profile with display name
        await updateProfile(userCredential.user, {
          displayName: formData.fullName
        });
        
        // Determine user role
        const userRole = showAdminOption && adminKey === ADMIN_SECRET_KEY ? 'admin' : 'user';
        console.log("Setting user role in Firestore:", userRole);
        
        // Store user role in Firestore - IMPORTANT: wait for this to complete
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: formData.fullName,
          email: formData.email,
          role: userRole,
          createdAt: new Date()
        });
        
        console.log('User registered with role:', userRole);
        
        // Reset form after successful submission
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Use React Router navigation instead of window.location
        navigate(userRole === 'admin' ? '/admin/dashboard' : '/dashboard');
        
      } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific Firebase auth errors
        switch(error.code) {
          case 'auth/email-already-in-use':
            setAuthError('This email is already in use');
            break;
          case 'auth/invalid-email':
            setAuthError('Invalid email format');
            break;
          case 'auth/weak-password':
            setAuthError('Password is too weak');
            break;
          default:
            setAuthError('An error occurred during registration. Please try again');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left Half - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
            <p className="mt-2 text-gray-600">Join our community today</p>
          </div>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
                disabled={loading}
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>
            
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
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
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? 
                    <EyeOff className="h-5 w-5 text-gray-400" /> : 
                    <Eye className="h-5 w-5 text-gray-400" />
                  }
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
            
            {/* Admin Registration Option */}
            <div className="flex items-center">
              <input
                id="admin-toggle"
                name="admin-toggle"
                type="checkbox"
                checked={showAdminOption}
                onChange={toggleAdminOption}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="admin-toggle" className="ml-2 block text-sm text-gray-700">
                Register as Administrator
              </label>
            </div>
            
            {showAdminOption && (
              <div>
                <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Secret Key
                </label>
                <input
                  type="password"
                  id="adminKey"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    errors.adminKey ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter admin secret key"
                  disabled={loading}
                />
                {errors.adminKey && <p className="mt-1 text-sm text-red-600">{errors.adminKey}</p>}
                
                {adminKey === ADMIN_SECRET_KEY && (
                  <p className="mt-1 text-sm text-green-600">Valid admin key ✓</p>
                )}
              </div>
            )}
            
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
      
      {/* Right Half - Image */}
      <div className="hidden lg:block lg:w-1/2 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90"></div>
        <img 
          src="https://img.freepik.com/premium-vector/smiling-cartoon-faceless-man-giving-five-huge-clock-high-productivity-time-management-skills-goal-fulfillment-2d-vector-concept-flat-style-illustration_776652-3045.jpg" 
          alt="Register background" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <h2 className="text-4xl font-bold mb-6 text-center">Start Your Journey</h2>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;