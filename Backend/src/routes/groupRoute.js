const express = require("express");
const Group = require("../models/group");
const User = require("../models/user");
const GroupChat = require("../models/groupChat");
const { userAuth } = require("../middlewares/auth");
const {
  createGroupRepo,
  addCollaborator,
  removeCollaborator,
  deleteGroupRepo,
} = require("../utils/githubService");
const { decrypt } = require("../utils/encryption");

const router = express.Router();

// Helper Functions
const isAdmin = (group, userId) =>
  group.members.some(
    (m) => m.userId.toString() === userId.toString() && m.role === "admin",
  );
const adminCount = (group) =>
  group.members.filter((m) => m.role === "admin").length;

// ─────────────────────────────────────────────
// CREATE GROUP
// ─────────────────────────────────────────────
router.post("/group/create", userAuth, async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;
    const userId = req.user._id;
    const user = req.user;

    if (!name) return res.status(400).json({ message: "Name required" });
    if (memberIds.length < 1)
      return res.status(400).json({ message: "Add at least one member" });

    const uniqueMemberIds = [...new Set(memberIds.map(String))];

    // Creator = Admin, Others = Member (Readonly)
    const members = [
      { userId, role: "admin", tags: [] },
      ...uniqueMemberIds.map((id) => ({
        userId: id,
        role: "member",
        tags: ["readonly"],
      })),
    ];

    let repoDetails = {};
    let adminToken = null;

    // 1. Create Repo if Creator has GitHub
    if (user.githubAccessToken?.content) {
      try {
        adminToken = decrypt(user.githubAccessToken);
        const githubData = await createGroupRepo(adminToken, name);
        repoDetails = {
          githubRepoId: githubData.repoId,
          githubRepoName: githubData.repoName,
          githubRepoUrl: githubData.repoUrl,
        };
      } catch (ghError) {
        console.error("Repo creation failed:", ghError.message);
      }
    }

    // 2. Save DB
    const group = await Group.create({ name, members, ...repoDetails });

    // 3. Invite Members (Async)
    if (repoDetails.githubRepoName && adminToken) {
      uniqueMemberIds.forEach(async (memberId) => {
        const mUser = await User.findById(memberId);
        if (mUser?.githubUsername) {
          await addCollaborator(
            adminToken,
            repoDetails.githubRepoName,
            mUser.githubUsername,
            "pull",
          );
        }
      });
    }

    res.status(201).json({ message: "Group created", group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─────────────────────────────────────────────
// ADD MEMBER
// ─────────────────────────────────────────────
router.post("/group/:groupId/add", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const { newUserId } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!isAdmin(group, req.user._id))
      return res.status(403).json({ message: "Admins only" });
    if (group.members.some((m) => m.userId.toString() === newUserId))
      return res.status(400).json({ message: "User exists" });

    group.members.push({
      userId: newUserId,
      role: "member",
      tags: ["readonly"],
    });
    await group.save();

    // Invite to GitHub (Pull)
    if (group.githubRepoName && req.user.githubAccessToken?.content) {
      const newUser = await User.findById(newUserId);
      if (newUser?.githubUsername) {
        const token = decrypt(req.user.githubAccessToken);
        await addCollaborator(
          token,
          group.githubRepoName,
          newUser.githubUsername,
          "pull",
        );
      }
    }
    res.json({ message: "Member added" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// PROMOTE TO WRITE ACCESS
// ─────────────────────────────────────────────
router.post("/group/:groupId/github-write", userAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { targetUserId } = req.body;
    const group = await Group.findById(groupId);

    if (!isAdmin(group, req.user._id))
      return res.status(403).json({ message: "Admins only" });
    if (!group.githubRepoName)
      return res.status(400).json({ message: "No repo linked" });

    const targetUser = await User.findById(targetUserId);
    if (!targetUser?.githubUsername)
      return res.status(400).json({ message: "User has no GitHub linked" });

    const token = decrypt(req.user.githubAccessToken);

    // GitHub: Push Access
    const success = await addCollaborator(
      token,
      group.githubRepoName,
      targetUser.githubUsername,
      "push",
    );

    if (success) {
      // Update DB Tags
      const member = group.members.find(
        (m) => m.userId.toString() === targetUserId,
      );
      member.tags = member.tags.filter((t) => t !== "readonly");
      if (!member.tags.includes("write")) member.tags.push("write");
      await group.save();
      res.json({ message: "Promoted to write access" });
    } else {
      res.status(500).json({ message: "GitHub update failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// DEMOTE TO READ ACCESS
// ─────────────────────────────────────────────
router.post("/group/:groupId/github-read", userAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { targetUserId } = req.body;
    const group = await Group.findById(groupId);

    if (!isAdmin(group, req.user._id))
      return res.status(403).json({ message: "Admins only" });
    if (!group.githubRepoName)
      return res.status(400).json({ message: "No repo linked" });

    const targetUser = await User.findById(targetUserId);
    if (!targetUser?.githubUsername)
      return res.status(400).json({ message: "User has no GitHub linked" });

    const token = decrypt(req.user.githubAccessToken);

    // 1. REMOVE completely (Forces GitHub to reset permissions)
    await removeCollaborator(
      token,
      group.githubRepoName,
      targetUser.githubUsername,
    );

    // 2. ADD back as Read-Only
    const success = await addCollaborator(
      token,
      group.githubRepoName,
      targetUser.githubUsername,
      "pull",
    );

    if (success) {
      // Update DB Tags
      const member = group.members.find(
        (m) => m.userId.toString() === targetUserId,
      );
      member.tags = member.tags.filter((t) => t !== "write");
      if (!member.tags.includes("readonly")) member.tags.push("readonly");
      await group.save();
      res.json({ message: "Demoted to read-only" });
    } else {
      res.status(500).json({ message: "GitHub update failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// DELETE GROUP & REPO
// ─────────────────────────────────────────────
router.delete("/group/:groupId", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Only Admin can delete
    if (!isAdmin(group, userId))
      return res.status(403).json({ message: "Admins only" });

    // 1. Attempt to delete GitHub Repo
    if (
      group.githubRepoName &&
      req.user.githubAccessToken &&
      req.user.githubAccessToken.content
    ) {
      try {
        const adminToken = decrypt(req.user.githubAccessToken);
        await deleteGroupRepo(adminToken, group.githubRepoName);
      } catch (ghErr) {
        console.error(
          "GitHub Repo Delete Failed (Deleting DB Group anyway):",
          ghErr.message,
        );
      }
    }

    // 2. Delete Group Document
    await Group.findByIdAndDelete(groupId);

    // 3. ✅ DELETE CHAT HISTORY
    await GroupChat.findOneAndDelete({ groupId: groupId });

    res.json({
      message: "Group, Repository, and Chat History deleted successfully",
    });
  } catch (err) {
    console.error("Delete Group Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ─────────────────────────────────────────────
   ✅ FIXED: REMOVE MEMBER (UPDATED)
   - Now removes user from GitHub Repo as well
───────────────────────────────────────────── */
router.post("/group/:groupId/remove", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const { targetUserId } = req.body;
  const userId = req.user._id; // Admin ID

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!isAdmin(group, userId))
      return res.status(403).json({ message: "Admins only" });

    const targetMember = group.members.find(
      (m) => m.userId.toString() === targetUserId,
    );
    if (!targetMember)
      return res.status(404).json({ message: "Member not found" });

    if (targetMember.role === "admin" && adminCount(group) <= 1)
      return res
        .status(400)
        .json({ message: "Group must have at least one admin" });

    // 1. Remove from MongoDB
    group.members = group.members.filter(
      (m) => m.userId.toString() !== targetUserId,
    );
    await group.save();

    // 2. ✅ Remove from GitHub (New Logic)
    // Only if repo exists AND admin has token
    if (
      group.githubRepoName &&
      req.user.githubAccessToken &&
      req.user.githubAccessToken.content
    ) {
      try {
        // Fetch the user being removed to get their GitHub username
        const removedUser = await User.findById(targetUserId);
        if (removedUser && removedUser.githubUsername) {
          const adminToken = decrypt(req.user.githubAccessToken);
          await removeCollaborator(
            adminToken,
            group.githubRepoName,
            removedUser.githubUsername,
          );
        }
      } catch (ghErr) {
        console.error("GitHub Remove Failed (Non-fatal):", ghErr.message);
      }
    }

    res.json({ message: "Member removed" });
  } catch (err) {
    console.error("Remove Member Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ─────────────────────────────────────────────
   ✅ FIXED: LEAVE GROUP (UPDATED)
   - Tries to remove user from GitHub as well
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   ✅ FIXED: LEAVE GROUP
   - Uses an Admin's token to remove the leaver from GitHub
───────────────────────────────────────────── */
router.post("/group/:groupId/leave", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id; // The user leaving

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const member = group.members.find(
      (m) => m.userId.toString() === userId.toString()
    );
    if (!member) return res.status(404).json({ message: "Not a group member" });

    if (member.role === "admin" && adminCount(group) <= 1)
      return res.status(400).json({ message: "Assign another admin before leaving" });

    // 1. Remove from MongoDB first
    group.members = group.members.filter(
      (m) => m.userId.toString() !== userId.toString()
    );
    await group.save();

    // 2. ✅ Remove from GitHub (Fixed Logic)
    // We must find an ADMIN of the group to authorize the removal
    if (group.githubRepoName && req.user.githubUsername) {
        
        // Find a group admin who has a GitHub connection
        // We need to fetch the full User objects for the admins
        const adminMembers = group.members.filter(m => m.role === 'admin');
        let adminToken = null;

        for (const admin of adminMembers) {
            const adminUser = await User.findById(admin.userId);
            if (adminUser && adminUser.githubAccessToken && adminUser.githubAccessToken.content) {
                adminToken = decrypt(adminUser.githubAccessToken);
                break; // Found a usable admin token
            }
        }

        if (adminToken) {
            try {
                await removeCollaborator(
                    adminToken, 
                    group.githubRepoName, 
                    req.user.githubUsername
                );
            } catch (ghErr) {
                console.error("GitHub Leave Failed (Non-fatal):", ghErr.message);
            }
        } else {
        }
    }

    res.json({ message: "Left group" });
  } catch (err) {
    console.error("Leave Group Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// OTHER ROUTES (Unchanged)
// ─────────────────────────────────────────────

router.get("/groups/my", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ "members.userId": userId }).select(
      "_id name members githubRepoUrl",
    );
    const formatted = groups.map((group) => {
      const me = group.members.find(
        (m) => m.userId.toString() === userId.toString(),
      );
      return {
        _id: group._id,
        name: group.name,
        githubRepoUrl: group.githubRepoUrl,
        myRole: me ? me.role : "unknown",
        myTags: me ? me.tags : [],
        membersCount: group.members.length,
      };
    });
    res.json({ groups: formatted });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/groups/:groupId", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;
  const group = await Group.findById(groupId).populate(
    "members.userId",
    "firstName lastName photoUrl",
  );
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (!group.members.some((m) => m.userId._id.toString() === userId.toString()))
    return res.status(403).json({ message: "Not a group member" });
  res.json({ group });
});

router.post("/group/:groupId/tags", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const { targetUserId, tags } = req.body;
  const userId = req.user._id;
  const group = await Group.findById(groupId);
  if (!isAdmin(group, userId))
    return res.status(403).json({ message: "Admins only" });
  const member = group.members.find(
    (m) => m.userId.toString() === targetUserId,
  );
  if (!member) return res.status(404).json({ message: "Member not found" });
  member.tags = Array.isArray(tags) ? tags : [];
  await group.save();
  res.json({ message: "Tags updated" });
});

module.exports = router;
