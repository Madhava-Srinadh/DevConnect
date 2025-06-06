import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";

const Premium = () => {
  const [isUserPremium, setIsUserPremium] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state for verification
  const [error, setError] = useState(""); // Added error state

  useEffect(() => {
    verifyPremiumUser();
  }, []);

  const verifyPremiumUser = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(BASE_URL + "/premium/verify", {
        withCredentials: true,
      });
      if (res.data.isPremium) {
        setIsUserPremium(true);
      } else {
        setIsUserPremium(false);
      }
    } catch (err) {
      console.error("Error verifying premium status:", err);
      setError("Failed to verify premium status.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = async (type) => {
    setError("");
    try {
      const order = await axios.post(
        BASE_URL + "/payment/create",
        {
          membershipType: type,
        },
        { withCredentials: true }
      );

      const { amount, keyId, currency, notes, orderId } = order.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "DevTinder",
        description: `DevTinder ${type.charAt(0).toUpperCase() + type.slice(1)} Membership`,
        order_id: orderId,
        prefill: {
          name: notes.firstName + " " + notes.lastName,
          email: notes.emailId,
          contact: "9999999999", // Placeholder contact number
        },
        theme: {
          color: "#8B5CF6", // Purple accent color
        },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              BASE_URL + "/payment/verify",
              response,
              { withCredentials: true }
            );
            if (verifyRes.data.success) {
              alert("Membership purchased successfully!");
              verifyPremiumUser(); // Re-verify user status after successful purchase
            } else {
              alert("Payment verification failed.");
            }
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            alert("An error occurred during payment verification.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Error creating order:", err);
      setError(err?.response?.data?.message || "Failed to initiate payment.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <span className="loading loading-spinner loading-lg text-purple-400"></span>
        <p className="ml-4 text-lg">Checking membership status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <h1 className="text-5xl font-bold mb-12 text-purple-400 text-center">
        {isUserPremium ? "You're already a Premium Dev!" : "Unlock Premium Features"}
      </h1>

      {isUserPremium && (
        <div className="alert alert-success bg-green-600 text-white shadow-lg max-w-md mx-auto mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>You have full access to all premium features.</span>
        </div>
      )}

      {!isUserPremium && (
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center">
          {/* Silver Membership Card */}
          <div className="card w-full md:w-1/2 lg:w-1/3 bg-gray-800 shadow-xl rounded-2xl border border-gray-700 hover:shadow-purple-500/50 hover:border-purple-600 transition-all duration-300 transform hover:-translate-y-2">
            <div className="card-body items-center text-center p-8">
              <h2 className="card-title text-4xl font-extrabold text-blue-400 mb-4">Silver Membership</h2>
              <p className="text-gray-300 text-lg mb-6">Perfect for serious networkers!</p>
              <ul className="text-left text-gray-200 space-y-3 mb-8">
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Chat with other people</li>
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> 100 connection Requests per day</li>
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Blue Tick Verification</li>
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> 3 months validity</li>
              </ul>
              <div className="text-5xl font-extrabold text-white mb-8">
                $9<span className="text-lg text-gray-400">/month</span>
              </div>
              <button
                onClick={() => handleBuyClick("silver")}
                className="btn btn-lg bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-colors duration-300 w-full"
              >
                Buy Silver
              </button>
            </div>
          </div>

          {/* Gold Membership Card */}
          <div className="card w-full md:w-1/2 lg:w-1/3 bg-gray-800 shadow-xl rounded-2xl border border-gray-700 hover:shadow-purple-500/50 hover:border-purple-600 transition-all duration-300 transform hover:-translate-y-2">
            <div className="card-body items-center text-center p-8">
              <h2 className="card-title text-4xl font-extrabold text-amber-400 mb-4">Gold Membership</h2>
              <p className="text-gray-300 text-lg mb-6">Unlimited connections, endless opportunities!</p>
              <ul className="text-left text-gray-200 space-y-3 mb-8">
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Chat with other people</li>
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Unlimited connection Requests</li>
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Blue Tick Verification</li>
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> 6 months validity</li>
                <li className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Priority Support</li>
              </ul>
              <div className="text-5xl font-extrabold text-white mb-8">
                $15<span className="text-lg text-gray-400">/month</span>
              </div>
              <button
                onClick={() => handleBuyClick("gold")}
                className="btn btn-lg bg-amber-600 border-amber-600 text-white hover:bg-amber-700 hover:border-amber-700 transition-colors duration-300 w-full"
              >
                Buy Gold
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error bg-red-600 text-white shadow-lg max-w-md mx-auto mt-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Premium;