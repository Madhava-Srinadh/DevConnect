import React from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const Profile = () => {
  const user = useSelector((store) => store.user);

  const handleUpgrade = async () => {
    try {
      const res = await axios.post(
        BASE_URL + "/payment/upgrade",
        {},
        { withCredentials: true }
      );
      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: res.data.order.amount,
        currency: res.data.order.currency,
        name: "DevTinder",
        description: "Membership Upgrade",
        order_id: res.data.order.id,
        handler: async (response) => {
          const verifyRes = await axios.post(
            BASE_URL + "/payment/verify",
            response,
            { withCredentials: true }
          );
          if (verifyRes.data.success) {
            alert("Membership upgraded to gold!");
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl">Profile</h1>
      <p>Membership: {user.membershipType}</p>
      {user.membershipType === "silver" && (
        <button
          onClick={handleUpgrade}
          className="bg-yellow-500 text-white p-2 mt-2"
        >
          Upgrade to Gold
        </button>
      )}
    </div>
  );
};

export default Profile;