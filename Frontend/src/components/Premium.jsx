import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";

const Premium = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [membershipType, setMembershipType] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // State for initial page load
  const [processingPlan, setProcessingPlan] = useState(null); // State for button loaders ('silver' or 'gold')

  useEffect(() => {
    const verifyPremiumUser = async () => {
      try {
        const res = await axios.get(BASE_URL + "/profile/view", {
          withCredentials: true,
        });
        dispatch(addUser(res.data));
        if (res.data?.isPremium) {
          setMembershipType(res.data.membershipType);
        }
      } catch (err) {
        console.error("Could not verify premium status.", err);
      } finally {
        setIsLoading(false); // Stop loading once verification is complete
      }
    };
    verifyPremiumUser();
  }, [dispatch]);

  const initiatePayment = async (endpoint, body = {}, planType) => {
    setProcessingPlan(planType); // Start the button loader
    try {
      const order = await axios.post(BASE_URL + endpoint, body, {
        withCredentials: true,
      });

      const { amount, keyId, currency, notes, orderId } = order.data;
      const options = {
        key: keyId,
        amount,
        currency,
        name: "DevConnect",
        description: "Membership Payment",
        order_id: orderId,
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.emailId,
          contact: "9999999999",
        },
        theme: {
          color: "#8B5CF6",
        },
        handler: async () => {
          const verifyRes = await axios.get(BASE_URL + "/profile/view", { withCredentials: true });
          dispatch(addUser(verifyRes.data));
          if (verifyRes.data?.isPremium) {
            setMembershipType(verifyRes.data.membershipType);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation failed", err);
      alert("Could not start payment. Please try again.");
    } finally {
      setProcessingPlan(null); // Stop the button loader
    }
  };

  const handleBuyClick = (type) => {
    initiatePayment("/payment/create", { membershipType: type }, type);
  };

  const handleUpgradeClick = () => {
    initiatePayment("/payment/upgrade", {}, "gold");
  };

  // Initial full-page loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (membershipType === "gold") {
    return (
      <div className="flex items-center justify-center h-screen text-2xl font-bold">
        You are already a Gold member!
      </div>
    );
  }

  return (
    <div className="m-10">
      <div className="flex w-full items-center justify-center">
        {membershipType === null && (
          <>
            <div className="card bg-base-300 rounded-box grid h-96 w-96 flex-grow place-items-center p-4">
              <h1 className="font-bold text-3xl">Silver Membership</h1>
              <ul className="list-disc text-left w-full px-10">
                <li>10 connection requests per day</li>
                <li>Verified badge</li>
                <li>3-month validity</li>
              </ul>
              <button
                onClick={() => handleBuyClick("silver")}
                className="btn btn-info"
                disabled={processingPlan === 'silver'}
              >
                {processingPlan === 'silver' ? <span className="loading loading-spinner"></span> : "Buy Silver (₹300)"}
              </button>
            </div>
            <div className="divider divider-horizontal">OR</div>
          </>
        )}

        <div className="card bg-base-300 rounded-box grid h-96 w-96 flex-grow place-items-center p-4">
          <h1 className="font-bold text-3xl">Gold Membership</h1>
          <ul className="list-disc text-left w-full px-10">
            <li>Unlimited connection requests</li>
            <li>Premium badge</li>
            <li>6-month validity</li>
            <li>Priority support</li>
          </ul>

          {membershipType === "silver" ? (
            <button
              onClick={handleUpgradeClick}
              className="btn btn-warning"
              disabled={processingPlan === 'gold'}
            >
              {processingPlan === 'gold' ? <span className="loading loading-spinner"></span> : "Upgrade to Gold (Pay Difference)"}
            </button>
          ) : (
            <button
              onClick={() => handleBuyClick("gold")}
              className="btn btn-primary"
              disabled={processingPlan === 'gold'}
            >
              {processingPlan === 'gold' ? <span className="loading loading-spinner"></span> : "Buy Gold (₹700)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Premium;