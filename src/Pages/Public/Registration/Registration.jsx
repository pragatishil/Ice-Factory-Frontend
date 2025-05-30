import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../../UserContext.jsx";
import "./Registration.css";
import axios from "axios";
import Footer from '../Components/Footer/Footer.jsx';
import Navbar from '../Components/Navbar/Navbar.jsx';

function Registration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(UserContext);
  
  // Extract redirect information if available
  const redirectPath = location.state?.redirectAfterRegister || '/';
  const redirectState = location.state || {};
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    pinCode: "",
    place: "",
    country: "India", // Default value
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Add state for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('terms');
  
  // Add this state for registration success at the top level
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ""
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    
    // Phone validation - must be exactly 10 digits
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Phone must be exactly 10 digits";
    }
    
    // Basic email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.pinCode.trim()) errors.pinCode = "PIN code is required";
    if (!formData.place.trim()) errors.place = "Place is required";
    if (!formData.country.trim()) errors.country = "Country is required";
    if (!formData.acceptTerms) errors.acceptTerms = "You must accept the terms and conditions";
    
    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      errors.password = "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain at least one number";
    } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
      errors.password = "Password must contain at least one special character (!@#$%^&*)";
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission with two-step API process
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset general error
    setError("");
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Create new user
      // Prepare data for API to match backend schema with nested structure
      const userData = {
        user: {
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          // rate is not collected in the form, using default value
          rate: 0
        },
        address: {
          street: formData.address,
          city: formData.place,
          pincode: formData.pinCode
        }
      };
      
      // Make first API call to create the user
      const userResponse = await axios.post(
        "http://localhost:8080/api/public/users/new", 
        userData
      );
      
      // Handle successful user creation (Step 1)
      if (userResponse.status === 200 || userResponse.status === 201) {
        // Step 2: Create user credentials
        try {
          // Create credentials object
          const credentialsData = {
            phone: formData.phone,
            password: formData.password
          };
          
          // Make second API call to create credentials
          const credentialsResponse = await axios.post(
            "http://localhost:8080/api/public/users/credentials",
            credentialsData  // Send directly in request body for @RequestBody
          );
          
          // Check if credentials were created successfully
          if (credentialsResponse.status === 201) {
            // Show success message
            setError(""); // Clear any previous errors
            
            // Use the existing state setter - this is the fix!
            setRegistrationSuccess(true);
            
            // Instead of logging in the user automatically, navigate to login page
            // with a success state parameter to show a welcome message
            setTimeout(() => {
              navigate('/login', { 
                state: { 
                  registrationSuccess: true,
                  phone: formData.phone,
                  message: "Registration successful! Please log in with your new credentials." 
                } 
              });
            }, 1500); // Short delay to show success message
          } else {
            // Handle credentials creation failure
            setError("Failed to create login credentials. Please contact support.");
          }
        } catch (credError) {
          console.error("Credentials creation error:", credError);
          
          // Handle credentials API error, but note that the user was already created
          setError("Your account was created, but there was an issue setting up your login credentials. Please contact support.");
        }
      } else {
        // Handle user creation failure
        setError(userResponse.data?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      if (err.response && err.response.data) {
        // Handle specific error from backend
        setError(err.response.data.message || "Registration failed. Please try again.");
        
        // Handle field-specific errors if the API returns them
        if (err.response.data.errors) {
          setFieldErrors(err.response.data.errors);
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Modal functions
  const openModal = (section) => {
    setActiveSection(section);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="registration-container">
      {registrationSuccess && (
        <div className="success-message">
          Registration successful! Redirecting to login page...
        </div>
      )}
      
      <div className="form-section right">
        <form onSubmit={handleSubmit} className="form-fields">
          <h2>Contact Details</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <input 
              type="text" 
              name="firstName"
              placeholder="First Name" 
              value={formData.firstName}
              onChange={handleChange}
              className={fieldErrors.firstName ? "error" : ""}
            />
            {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
          </div>
          
          <div className="input-group">
            <input 
              type="text" 
              name="lastName"
              placeholder="Last Name" 
              value={formData.lastName}
              onChange={handleChange}
              className={fieldErrors.lastName ? "error" : ""}
            />
            {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
          </div>
          
          <div className="input-group">
            <input 
              type="tel" 
              name="phone"
              placeholder="Contact No" 
              value={formData.phone}
              onChange={handleChange}
              className={fieldErrors.phone ? "error" : ""}
              maxLength="10"
            />
            {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
          </div>
          
          <div className="input-group">
            <input 
              type="email" 
              name="email"
              placeholder="Your Email" 
              value={formData.email}
              onChange={handleChange}
              className={fieldErrors.email ? "error" : ""}
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>
          
          {/* Password fields moved here */}
          <div className="input-group">
            <input 
              type="password" 
              name="password"
              placeholder="Create Password" 
              value={formData.password}
              onChange={handleChange}
              className={fieldErrors.password ? "error" : ""}
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          <div className="input-group">
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="Confirm Password" 
              value={formData.confirmPassword}
              onChange={handleChange}
              className={fieldErrors.confirmPassword ? "error" : ""}
            />
            {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
          </div>
          
          <div className="input-group">
            <input 
              type="text" 
              name="address"
              placeholder="Address" 
              value={formData.address}
              onChange={handleChange}
              className={fieldErrors.address ? "error" : ""}
            />
            {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
          </div>
          
          <div className="form-row">
            <div className="input-group">
              <input 
                type="text" 
                name="pinCode"
                placeholder="Pin Code" 
                value={formData.pinCode}
                onChange={handleChange}
                className={fieldErrors.pinCode ? "error" : ""}
              />
              {fieldErrors.pinCode && <span className="field-error">{fieldErrors.pinCode}</span>}
            </div>
            
            <div className="input-group">
              <input 
                type="text" 
                name="place"
                placeholder="City" 
                value={formData.place}
                onChange={handleChange}
                className={fieldErrors.place ? "error" : ""}
              />
              {fieldErrors.place && <span className="field-error">{fieldErrors.place}</span>}
            </div>
          </div>
          
          <div className="input-group">
            <input 
              type="text" 
              name="country"
              placeholder="Country" 
              value={formData.country}
              onChange={handleChange}
              className={fieldErrors.country ? "error" : ""}
            />
            {fieldErrors.country && <span className="field-error">{fieldErrors.country}</span>}
          </div>
          
          <div className="terms-wrapper">
            <div className="terms-checkbox-container">
              <input 
                type="checkbox" 
                id="terms-checkbox" 
                name="acceptTerms"
                className={`terms-checkbox ${fieldErrors.acceptTerms ? "error" : ""}`}
                checked={formData.acceptTerms}
                onChange={handleChange}
              />
              <label htmlFor="terms-checkbox" className="terms-text">
                I agree to the <button type="button" onClick={() => openModal('terms')} className="terms-link">Terms and Conditions</button> and <button type="button" onClick={() => openModal('privacy')} className="terms-link">Privacy Policy</button>
              </label>
            </div>
            {fieldErrors.acceptTerms && <span className="field-error">{fieldErrors.acceptTerms}</span>}
          </div>
          
          <button 
            type="submit" 
            className="register-button" 
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
      
      {/* Modal for terms and privacy policy */}
      {isModalOpen && (
        <div className="legal-modal">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>&times;</button>
            
            {activeSection === 'terms' && (
              <div className="legal-section" id="terms">
                <div className="terms-section">
                  <h3>Terms and Conditions</h3>
                  <p>By registering and creating an account with Muzaffarpur Ice, you agree to the following terms and conditions. Please read them carefully before proceeding.</p>
                  <ol>
                    <li><strong>Eligibility:</strong> You must be at least 18 years old to create an account and use our services.</li>
                    <li><strong>Accurate Information:</strong> You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate and complete.</li>
                    <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.</li>
                    <li><strong>Use of Services:</strong> You agree to use the services only for lawful purposes and in accordance with these terms.</li>
                    <li><strong>Termination:</strong> We reserve the right to suspend or terminate your account if any information provided during the registration process or thereafter is found to be inaccurate or misleading.</li>
                  </ol>
                </div>
              </div>
            )}
            
            {activeSection === 'privacy' && (
              <div className="legal-section" id="privacy">
                <div className="terms-section">
                  <h3>Privacy Policy</h3>
                  <p>Your privacy is important to us. By registering, you agree to the collection and use of your personal information as outlined in our Privacy Policy.</p>
                  <ul>
                    <li>We collect personal details like name, phone number, email, and address solely for service-related purposes.</li>
                    <li>We do not share your data with third parties without your consent, except as required by law.</li>
                    <li>You can request to review, update, or delete your information at any time.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Registration;