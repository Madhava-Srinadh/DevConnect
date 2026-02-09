const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

// ✅ Added "profileStatus" here so it's visible in Feed & Requests
const USER_SAFE_DATA =
  "firstName lastName photoUrl age gender about skills connectionsCount profileStatus";

// Get all the pending connection requests for the loggedIn user
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);

    res.json({
      message: "Data fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

userRouter.get("/user/search", userAuth, async (req, res) => {
  try {
    const { q } = req.query;
    const loggedInUserId = req.user._id;

    if (!q) {
      return res.status(400).json({ message: "Search query required" });
    }

    const users = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
      ],
    }).select("firstName lastName photoUrl about skills profileStatus"); // ✅ Added profileStatus here

    if (!users.length) return res.json({ data: [] });

    const userIds = users.map((u) => u._id);

    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUserId, toUserId: { $in: userIds } },
        { fromUserId: { $in: userIds }, toUserId: loggedInUserId },
      ],
    });

    const enrichedUsers = users.map((user) => {
      const conn = connections.find(
        (c) =>
          (c.fromUserId.equals(loggedInUserId) &&
            c.toUserId.equals(user._id)) ||
          (c.toUserId.equals(loggedInUserId) && c.fromUserId.equals(user._id)),
      );

      let connectionStatus = "none";
      let requestId = null;

      if (conn) {
        requestId = conn._id;

        if (conn.status === "accepted") {
          connectionStatus = "connected";
        } else if (conn.status === "ignored") {
          connectionStatus = "ignored";
        } else if (conn.status === "rejected") {
          connectionStatus = "rejected";
        } else if (
          conn.status === "interested" &&
          conn.fromUserId.equals(loggedInUserId)
        ) {
          connectionStatus = "pending";
        } else if (
          conn.status === "interested" &&
          conn.toUserId.equals(loggedInUserId)
        ) {
          connectionStatus = "received";
        }
      }

      return {
        ...user.toObject(),
        connectionStatus,
        requestId,
      };
    });

    // 🔥 FINAL FILTER (IMPORTANT)
    const filteredUsers = enrichedUsers.filter(
      (u) => !["ignored", "rejected"].includes(u.connectionStatus),
    );

    res.json({ data: filteredUsers });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

userRouter.get(
  "/user/userConnections/:targetUserId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { targetUserId } = req.params;

      // 1. Fetch the Target User (we need their profileStatus and connections list)
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // 2. Determine Visibility Logic
      const isSelf = loggedInUser._id.toString() === targetUserId.toString();
      const isPublic = targetUser.profileStatus === "public";

      // Check if the logged-in user is already inside the target's connection list
      const isConnected = targetUser.connections.some(
        (connId) => connId.toString() === loggedInUser._id.toString(),
      );
      // 3. Access Control Check
      // ALLOW IF: It's Me OR It's Public OR We are Connected
      if (!isSelf && !isPublic && !isConnected) {
        return res.status(403).json({
          message:
            "Account is Private. Connect with them to see their network.",
          data: [],
        });
      }

      // 4. Populate the connections array
      // Since we maintain the 'connections' array in the User model (from previous steps),
      // we can simply populate it instead of querying the ConnectionRequest collection again.
      await targetUser.populate({
        path: "connections",
        select: USER_SAFE_DATA, // Only return safe fields
      });
      res.json({
        message: "Connections fetched successfully",
        data: targetUser.connections,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  },
);

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({ data });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(USER_SAFE_DATA)
      .sort({ connectionsCount: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ data: users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
