import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";

const Login = () => {
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        BASE_URL + "/login",
        {
          emailId,
          password,
        },
        { withCredentials: true }
      );
      dispatch(addUser(res.data));
      localStorage.setItem('authToken', res.data.token); // Store token if your backend sends one
      return navigate("/"); // Navigate to home/feed after successful login
    } catch (err) {
      console.error("Login failed:", err);
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        BASE_URL + "/signup",
        { firstName, lastName, emailId, password },
        { withCredentials: true }
      );
      dispatch(addUser(res.data.data));
      localStorage.setItem('authToken', res.data.data.token); // Store token if your backend sends one
      return navigate("/profile"); // Navigate to profile after successful signup
    } catch (err) {
      console.error("Signup failed:", err);
      setError(err?.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
      <div className="card w-full max-w-md bg-white text-gray-900 shadow-2xl rounded-xl">
        <div className="card-body items-center text-center p-8">
          <h2 className="card-title text-4xl font-extrabold mb-6 text-indigo-700">
            {isLoginForm ? "Welcome Back!" : "Join DevConnect"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isLoginForm ? "Sign in to connect with other developers." : "Create your account and find your next connection."}
          </p>

          <div className="w-full space-y-4">
            {!isLoginForm && (
              <>
                <label className="form-control w-full max-w-xs mx-auto">
                  <div className="label">
                    <span className="label-text text-gray-700">First Name:</span>
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    className="input input-bordered w-full bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    placeholder="John"
                  />
                </label>
                <label className="form-control w-full max-w-xs mx-auto">
                  <div className="label">
                    <span className="label-text text-gray-700">Last Name:</span>
                  </div>
                  <input
                    type="text"
                    value={lastName}
                    className="input input-bordered w-full bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    placeholder="Doe"
                  />
                </label>
              </>
            )}
            <label className="form-control w-full max-w-xs mx-auto">
              <div className="label">
                <span className="label-text text-gray-700">Email ID:</span>
              </div>
              <input
                type="email"
                value={emailId}
                className="input input-bordered w-full bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => setEmailId(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
              />
            </label>
            <label className="form-control w-full max-w-xs mx-auto">
              <div className="label">
                <span className="label-text text-gray-700">Password:</span>
              </div>
              <input
                type="password"
                value={password}
                className="input input-bordered w-full bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
              />
            </label>
          </div>
          {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
          <div className="card-actions justify-center mt-6">
            <button
              className="btn btn-primary btn-lg w-full bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              onClick={isLoginForm ? handleLogin : handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner text-white"></span>
              ) : (
                isLoginForm ? "Login" : "Sign Up"
              )}
            </button>
          </div>

          <p
            className="mt-6 cursor-pointer text-indigo-500 hover:text-indigo-700 transition-colors duration-200 text-sm"
            onClick={() => {
              setIsLoginForm((value) => !value);
              setError(""); // Clear error when switching forms
              setFirstName(""); // Clear form fields
              setLastName("");
              setEmailId("");
              setPassword("");
            }}
          >
            {isLoginForm ? "New User? Create an Account" : "Already a User? Log In Here"}
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;