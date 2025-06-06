// src/components/Premium.jsx

import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { useSelector, useDispatch } from "react-redux"; // To access user from Redux and update it
import { addUser } from "../utils/userSlice"; // Import addUser action

// Define plan details for cleaner JSX
const plans = [
  {
    type: "silver",
    title: "Silver Membership",
    price: 300, // Rupees
    duration: "3 months",
    features: [
      "Chat with other developers",
      "100 connection requests/day",
      "Verified badge",
    ],
    btnClass: "bg-blue-600 hover:bg-blue-700", // Tailwind/DaisyUI class
  },
  {
    type: "gold",
    title: "Gold Membership",
    price: 700, // Rupees
    duration: "6 months",
    features: [
      "Unlimited chat",
      "Unlimited connection requests",
      "Premium badge",
      "Priority support",
    ],
    btnClass: "bg-amber-600 hover:bg-amber-700", // Tailwind/DaisyUI class
  },
];

const Premium = () => {
  const user = useSelector((store) => store.user); // Get user from Redux
  const dispatch = useDispatch(); // For updating Redux store if needed
  const navigate = useNavigate(); // For redirection

  // Use user.isPremium and user.membershipType directly from Redux for display
  // No need for a separate userStatus state if Redux is the source of truth
  // const [userStatus, setUserStatus] = useState(null); // No longer needed as primary source
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [processingPlanType, setProcessingPlanType] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // New state to track if we're waiting for premium status update after payment
  const [waitingForPremiumUpdate, setWaitingForPremiumUpdate] = useState(false);
  const pollingIntervalRef = useRef(null); // To store the interval ID

  // Function to load Razorpay SDK dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        setError("Failed to load Razorpay SDK. Check your internet connection.");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Function to verify user's premium status and update Redux
  const verifyPremiumUser = async () => {
    // Only show global loading spinner if it's the initial load, not during polling
    if (!waitingForPremiumUpdate) {
      setIsLoadingUser(true);
    }
    setError(null); // Clear errors
    // setSuccessMessage(null); // DO NOT clear success message here, it's set after payment

    try {
      // This endpoint fetches the latest user status including premium info
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials: true,
      });
      // The response structure from /profile/view is `res.data` which is the user object
      // This is exactly what your userSlice's addUser expects.
      dispatch(addUser(res.data)); // Update Redux store with latest user data
      return res.data; // Return data for polling logic
    } catch (err) {
      // If fetching fails, user is likely not authenticated or session expired.
      // ProtectedRoute handles full unauth, but for premium page,
      // we might want to just show an error if status can't be fetched.
      console.error("Failed to fetch user's membership status:", err);
      // ProtectedRoute also dispatches removeUser and navigates to login if auth fails.
      // So, here we just show an error message specific to membership status check.
      setError("Failed to fetch your membership status. Please try refreshing.");
      return null; // Return null on error
    } finally {
      if (!waitingForPremiumUpdate) {
        setIsLoadingUser(false);
      }
    }
  };

  useEffect(() => {
    // Initial verification when component mounts
    verifyPremiumUser();

    // Cleanup polling interval if component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
    // Depend on user.emailId or _id to re-run if Redux user state changes (e.g., after login/logout elsewhere)
  }, [dispatch, navigate, user?.emailId, user?._id]); // Added user dependencies

  // Handles both new purchases and upgrades
  const initiatePayment = async (endpoint, targetPlanType = null) => {
    setProcessingPlanType(targetPlanType); // Set the specific plan type being processed
    setError(null);
    setSuccessMessage(null); // Clear any previous success message

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setProcessingPlanType(null); // Reset
      return;
    }

    try {
      const orderRes = await axios.post(
        BASE_URL + endpoint,
        targetPlanType && targetPlanType !== "gold" // Send membershipType only for `/payment/create` if not upgrade to gold
          ? { membershipType: targetPlanType }
          : {}, // For upgrade, the backend knows it's to gold
        { withCredentials: true }
      );

      // Your backend returns keyId, amount, currency, notes, orderId
      const { amount, keyId, currency, notes, orderId } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "DevTinder",
        description: `DevTinder ${
          notes.membershipType
            ? notes.membershipType.charAt(0).toUpperCase() +
              notes.membershipType.slice(1)
            : ""
        } Membership`,
        order_id: orderId,
        prefill: {
          name: notes.firstName + " " + notes.lastName,
          email: notes.emailId,
          contact: user?.phone || "9999999999", // Use actual user phone if available from Redux, otherwise default
        },
        theme: {
          color: "#8B5CF6", // Purple accent color
        },
        handler: async (response) => {
          // This handler is called on successful payment by Razorpay.
          // NOW WE START POLLING FOR THE BACKEND TO UPDATE THE USER STATUS.
          setSuccessMessage("Payment successful! Verifying membership update...");
          setWaitingForPremiumUpdate(true);
          setProcessingPlanType(null); // Payment modal is closed, now waiting for backend update

          // Store current user status for comparison to detect a change
          const currentMembershipType = user?.membershipType; // From Redux

          pollingIntervalRef.current = setInterval(async () => {
            const updatedUser = await verifyPremiumUser(); // This updates Redux and returns the new user object
            if (updatedUser) {
              const newMembershipType = updatedUser.membershipType;

              // Condition for successful update:
              // 1. User is now premium
              // 2. The membership type has changed from the one before payment initiation
              //    (e.g., null -> silver, or silver -> gold)
              //    This ensures we wait for the actual update.
              if (
                updatedUser.isPremium &&
                newMembershipType && // Ensure newMembershipType is not null/undefined
                newMembershipType !== currentMembershipType // The type changed
              ) {
                clearInterval(pollingIntervalRef.current); // Stop polling
                setWaitingForPremiumUpdate(false);
                setSuccessMessage("Your membership has been successfully updated!");
                navigate("/profile"); // Redirect to profile or home page
              }
            } else {
              // Handle cases where verifyPremiumUser itself fails during polling
              console.warn("Polling: Failed to fetch user status.");
              // Optionally, implement a timeout or retry limit for polling
            }
          }, 3000); // Poll every 3 seconds (adjust as needed, typically 3-5 seconds is good)
        },
        modal: {
          onDismiss: () => {
            setError("Payment process cancelled by user.");
            setProcessingPlanType(null); // Reset
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      // More specific error message if available from backend
      const errorMessage =
        err.response?.data?.msg || "Failed to initiate payment. Please try again.";
      setError(errorMessage);
      setProcessingPlanType(null); // Reset
    }
  };

  const handleBuyClick = (type) => {
    initiatePayment("/payment/create", type);
  };

  const handleUpgradeClick = () => {
    // When upgrading, the target plan is implicitly 'gold' for the frontend logic
    initiatePayment("/payment/upgrade", "gold");
  };

  // --- UI RENDERING ---
  // Show loading during initial fetch OR while waiting for webhook update
  if (isLoadingUser || waitingForPremiumUpdate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <span className="loading loading-spinner loading-lg text-purple-400"></span>
        <p className="ml-4 text-lg mt-4">
          {isLoadingUser
            ? "Checking your membership status..."
            : "Processing payment and verifying membership update..."}
        </p>
        {waitingForPremiumUpdate && (
          <p className="text-sm text-gray-400 mt-2">
            Please do not close this page.
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-red-400 p-4">
        <h2 className="text-xl font-bold mb-4">Error:</h2>
        <p>{error}</p>
        <button className="btn btn-primary mt-4" onClick={verifyPremiumUser}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <h1 className="text-5xl font-bold mb-12 text-purple-400 text-center">
        {user?.isPremium // Use user from Redux directly
          ? `You're already a ${
              user.membershipType.charAt(0).toUpperCase() +
              user.membershipType.slice(1)
            } Dev!`
          : "Unlock Premium Features"}
      </h1>

      {/* Success Message Display */}
      {successMessage && (
        <div className="alert alert-success bg-green-600 text-white shadow-lg max-w-md mx-auto mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Already Premium Message (Specific for Gold) */}
      {user?.isPremium && user?.membershipType === "gold" && (
        <div className="alert alert-info bg-purple-600 text-white shadow-lg max-w-md mx-auto mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            You are currently a Gold member and have access to all premium
            features.
          </span>
        </div>
      )}

      {/* Show plans only if not premium or if silver member for upgrade option */}
      {!user?.isPremium || user?.membershipType === "silver" ? (
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center">
          {plans.map((plan) => {
            // Logic to determine if a plan card should be shown
            if (user?.isPremium && user?.membershipType === "gold") {
              return null; // Don't show any plans if already gold
            }
            // If already silver, only show the gold upgrade option
            if (
              user?.isPremium &&
              user?.membershipType === "silver" &&
              plan.type === "silver"
            ) {
              return null; // Hide silver plan if already silver
            }

            const isCurrentPlan = user?.isPremium && user?.membershipType === plan.type;
            const isUpgradeOption =
              user?.isPremium && user?.membershipType === "silver" && plan.type === "gold";

            // Determine if THIS button should be loading
            const isThisButtonProcessing =
              processingPlanType === (isUpgradeOption ? "gold" : plan.type);

            return (
              <div
                key={plan.type}
                className={`card w-full md:w-1/2 lg:w-1/3 bg-gray-800 shadow-xl rounded-2xl border ${
                  isCurrentPlan ? "border-purple-600" : "border-gray-700"
                } hover:shadow-purple-500/50 hover:border-purple-600 transition-all duration-300 transform hover:-translate-y-2`}
              >
                <div className="card-body items-center text-center p-8">
                  <h2
                    className={`card-title text-4xl font-extrabold mb-4 ${
                      plan.type === "silver" ? "text-blue-400" : "text-amber-400"
                    }`}
                  >
                    {plan.title}
                  </h2>
                  <p className="text-gray-300 text-lg mb-6">
                    {isUpgradeOption
                      ? "Upgrade and unlock more!"
                      : "Perfect for serious networkers!"}
                  </p>
                  <ul className="text-left text-gray-200 space-y-3 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>{" "}
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <div className="text-5xl font-extrabold text-white mb-8">
                    ₹{plan.price}
                    <span className="text-lg text-gray-400">
                      /{plan.duration.split(" ")[0]}
                    </span>
                  </div>
                  {isUpgradeOption ? (
                    <button
                      onClick={handleUpgradeClick}
                      disabled={isThisButtonProcessing}
                      className={`btn btn-lg w-full text-white transition-colors duration-300 ${
                        isThisButtonProcessing
                          ? "opacity-70 cursor-not-allowed"
                          : plan.btnClass
                      }`}
                    >
                      {isThisButtonProcessing ? (
                        <span className="loading loading-spinner loading-md text-white"></span>
                      ) : (
                        "Upgrade to Gold"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyClick(plan.type)}
                      disabled={isThisButtonProcessing}
                      className={`btn btn-lg w-full text-white transition-colors duration-300 ${
                        isThisButtonProcessing
                          ? "opacity-70 cursor-not-allowed"
                          : plan.btnClass
                      }`}
                    >
                      {isThisButtonProcessing ? (
                        <span className="loading loading-spinner loading-md text-white"></span>
                      ) : (
                        `Buy ${plan.title.split(" ")[0]}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // If already gold, no plans to show
        null
      )}
    </div>
  );
};

export default Premium;