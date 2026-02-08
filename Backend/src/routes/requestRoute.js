const express = require("express");
const requestRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const { checkRequestLimit } = require("../middlewares/requestLimiter");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

// ─────────────────────────────────────────────────────────────
// SEND CONNECTION REQUEST
// ─────────────────────────────────────────────────────────────
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  checkRequestLimit,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const { toUserId, status } = req.params;

      const allowedStatus = ["ignored", "interested"];
      if (!allowedStatus.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status type: " + status });
      }

      // 1. Check if the user we are sending request to exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found!!" });
      }

      // 2. Check if there is already an existing request (A -> B or B -> A)
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ message: "Connection Request Already Exists!!" });
      }

      // 3. Create and Save the Request
      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();

      res.json({
        message:
          req.user.firstName + " is " + status + " in " + toUser.firstName,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  },
);

// ─────────────────────────────────────────────────────────────
// REVIEW CONNECTION REQUEST (ACCEPT / REJECT)
// ─────────────────────────────────────────────────────────────
requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Status not allowed" });
      }

      // 1. Find the request
      // It must exist, be addressed to the loggedInUser, and currently be "interested"
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });

      if (!connectionRequest) {
        return res
          .status(404)
          .json({ message: "Connection request not found!!" });
      }

      // 2. Update the status of the request
      connectionRequest.status = status;
      const data = await connectionRequest.save();

      // 3. SPECIAL LOGIC: IF ACCEPTED
      if (status === "accepted") {
        const senderId = connectionRequest.fromUserId;
        const receiverId = connectionRequest.toUserId;

        // Promise.all lets these two database operations run in parallel for speed
        await Promise.all([
          // Update Sender: Add Receiver ID to connections array + Increment Count
          User.findByIdAndUpdate(senderId, {
            $addToSet: { connections: receiverId }, // $addToSet prevents duplicates
            $inc: { connectionsCount: 1 },
          }),

          // Update Receiver: Add Sender ID to connections array + Increment Count
          User.findByIdAndUpdate(receiverId, {
            $addToSet: { connections: senderId },
            $inc: { connectionsCount: 1 },
          }),
        ]);
      }

      res.json({ message: "Connection request " + status, data });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  },
);

module.exports = requestRouter;
