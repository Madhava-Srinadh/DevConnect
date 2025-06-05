import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const PlanCard = ({
  title,
  price,
  features,
  isCurrentPlan,
  onSelect,
  upgradePrice,
  membershipType,
  type,
}) => (
  <div
    className={`card bg-base-300 shadow-xl transition-all hover:shadow-2xl
    ${isCurrentPlan ? "border-2 border-primary" : ""}`}
  >
    <div className="card-body">
      <h2 className="card-title justify-center text-2xl mb-6">{title}</h2>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <span className="text-primary mr-2">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <div className="card-actions justify-center">
        {isCurrentPlan ? (
          <span className="text-primary font-bold">Current Plan</span>
        ) : membershipType === "silver" && type === "gold" ? (
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onSelect(type)}
          >
            Upgrade – ₹{upgradePrice}
          </button>
        ) : membershipType !== "gold" ? (
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onSelect(type)}
          >
            Get {title} – ₹{price}
          </button>
        ) : (
          <span className="text-gray-500">Already on Gold plan</span>
        )}
      </div>
    </div>
  </div>
);

const Premium = () => {
  const user = useSelector((store) => store.user);
  const [membershipType, setMembershipType] = useState(
    user?.membershipType || "basic"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Whenever the Redux `user.membershipType` changes (e.g. after a page reload),
  // sync our local state:
  useEffect(() => {
    if (user?.membershipType) {
      setMembershipType(user.membershipType);
    }
  }, [user?.membershipType]);

  const plans = {
    silver: {
      title: "Silver Membership",
      price: 500,       // display price (₹500)
      features: [
        "Chat with connections",
        "100 connection requests/day",
        "Verified badge",
        "3 months validity",
      ],
    },
    gold: {
      title: "Gold Membership",
      price: 900,       // display price (₹900)
      upgradePrice: 400, // display upgrade price (₹400)
      features: [
        "Unlimited chat",
        "Unlimited connection requests",
        "Premium badge",
        "6 months validity",
      ],
    },
  };

  const handlePayment = async (type) => {
    try {
      setLoading(true);
      setError(null);

      // If user is currently silver and wants gold → use /payment/upgrade
      // Otherwise (e.g. basic → silver, basic → gold) → use /payment/create
      const isUpgrade = membershipType === "silver" && type === "gold";
      const endpoint = isUpgrade ? "/payment/upgrade" : "/payment/create";

      const response = await axios.post(
        `${BASE_URL}${endpoint}`,
        { membershipType: type },
        { withCredentials: true }
      );

      // The backend returns:
      // { userId, orderId, status, amount, currency, receipt, notes, keyId }
      const {
        amount,       // e.g. 40000 (paise)
        orderId,      // e.g. "order_XXXXXXXX"
        currency,     // "INR"
        keyId,        // your RAZORPAY_KEY_ID
      } = response.data;

      const options = {
        key: keyId,
        amount,       // razorpay expects paise (already correct)
        currency,
        name: "DevTinder",
        description:
          type.charAt(0).toUpperCase() + type.slice(1) + " Membership",
        order_id: orderId,
        handler: async (razorResponse) => {
          try {
            // After Razorpay payment is captured, our backend’s webhook
            // will flip `isPremium`+`membershipType`. So here we simply re-fetch:
            const verifyRes = await axios.get(
              `${BASE_URL}/payment/premium/verify`,
              { withCredentials: true }
            );
            // verifyRes.data contains the updated user object
            if (verifyRes.data.membershipType) {
              setMembershipType(verifyRes.data.membershipType);
              alert(
                `Successfully upgraded to ${verifyRes.data.membershipType} membership!`
              );
            }
          } catch (verifyError) {
            console.error("Verify error:", verifyError);
            setError("Payment succeeded, but verification failed.");
          }
        },
        prefill: {
          name: user?.firstName + " " + user?.lastName,
          email: user?.emailId,
        },
        theme: {
          color: "#409EFF",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-10">
        Premium Memberships
      </h1>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <PlanCard
          {...plans.silver}
          isCurrentPlan={membershipType === "silver"}
          onSelect={handlePayment}
          membershipType={membershipType}
          type="silver"
        />

        <PlanCard
          {...plans.gold}
          isCurrentPlan={membershipType === "gold"}
          onSelect={handlePayment}
          membershipType={membershipType}
          type="gold"
        />
      </div>
    </div>
  );
};

export default Premium;
