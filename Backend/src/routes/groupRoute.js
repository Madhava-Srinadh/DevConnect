const express = require("express");
const Group = require("../models/group");
const { userAuth } = require("../middlewares/auth");

const router = express.Router();

/* ─────────────────────────────────────────────
   HELPER FUNCTIONS
───────────────────────────────────────────── */

/**
 * Check if user is admin of the group
 */
const isAdmin = (group, userId) =>
  group.members.some(
    (m) => m.userId.toString() === userId.toString() && m.role === "admin",
  );

/**
 * Count admins in a group
 */
const adminCount = (group) =>
  group.members.filter((m) => m.role === "admin").length;

/* ─────────────────────────────────────────────
   CREATE GROUP
   POST /group/create
   - Creator becomes ADMIN
   - Minimum 1 member required
───────────────────────────────────────────── */
router.post("/group/create", userAuth, async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;
    const userId = req.user._id;

    if (!name) return res.status(400).json({ message: "Group name required" });

    if (memberIds.length < 1)
      return res.status(400).json({ message: "At least one member required" });

    const uniqueMemberIds = [...new Set(memberIds.map(String))];

    const members = [
      { userId, role: "admin", tags: [] },
      ...uniqueMemberIds.map((id) => ({
        userId: id,
        role: "member",
        tags: [],
      })),
    ];

    const group = await Group.create({ name, members });

    res.status(201).json({ message: "Group created", group });
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ─────────────────────────────────────────────
   GET MY GROUPS
   GET /groups/my
   - Returns groups where logged-in user is a member
───────────────────────────────────────────── */
router.get("/groups/my", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      "members.userId": userId,
    }).select("_id name members");

    const formatted = groups.map((group) => {
      const me = group.members.find(
        (m) => m.userId.toString() === userId.toString(),
      );

      return {
        _id: group._id,
        name: group.name,
        myRole: me.role,
        myTags: me.tags,
        membersCount: group.members.length,
      };
    });

    res.json({ groups: formatted });
  } catch (err) {
    console.error("Fetch my groups error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ─────────────────────────────────────────────
   GET GROUP DETAILS
   GET /groups/:groupId
   - Only accessible by group members
───────────────────────────────────────────── */
router.get("/groups/:groupId", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const group = await Group.findById(groupId).populate(
    "members.userId",
    "firstName lastName",
  );

  if (!group) return res.status(404).json({ message: "Group not found" });

  const isMember = group.members.some(
    (m) => m.userId._id.toString() === userId.toString(),
  );

  if (!isMember) return res.status(403).json({ message: "Not a group member" });

  res.json({ group });
});

/* ─────────────────────────────────────────────
   ADD MEMBER (ADMINS ONLY)
   POST /group/:groupId/add
───────────────────────────────────────────── */
router.post("/group/:groupId/add", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const { newUserId } = req.body;
  const userId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (!isAdmin(group, userId))
    return res.status(403).json({ message: "Admins only" });

  const exists = group.members.some((m) => m.userId.toString() === newUserId);

  if (exists) return res.status(400).json({ message: "User already in group" });

  group.members.push({
    userId: newUserId,
    role: "member",
    tags: [],
  });

  await group.save();
  res.json({ message: "Member added" });
});

/* ─────────────────────────────────────────────
   REMOVE MEMBER (ADMINS ONLY)
   POST /group/:groupId/remove
───────────────────────────────────────────── */
router.post("/group/:groupId/remove", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const { targetUserId } = req.body;
  const userId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (!isAdmin(group, userId))
    return res.status(403).json({ message: "Admins only" });

  const target = group.members.find(
    (m) => m.userId.toString() === targetUserId,
  );

  if (!target) return res.status(404).json({ message: "Member not found" });

  if (target.role === "admin" && adminCount(group) <= 1)
    return res
      .status(400)
      .json({ message: "Group must have at least one admin" });

  group.members = group.members.filter(
    (m) => m.userId.toString() !== targetUserId,
  );

  await group.save();
  res.json({ message: "Member removed" });
});

/* ─────────────────────────────────────────────
   CHANGE ROLE (PROMOTE / DEMOTE ADMIN)
   POST /group/:groupId/role
───────────────────────────────────────────── */
router.post("/group/:groupId/role", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const { targetUserId, role } = req.body;
  const userId = req.user._id;

  if (!["admin", "member"].includes(role))
    return res.status(400).json({ message: "Invalid role" });

  const group = await Group.findById(groupId);

  if (!isAdmin(group, userId))
    return res.status(403).json({ message: "Admins only" });

  const member = group.members.find(
    (m) => m.userId.toString() === targetUserId,
  );

  if (!member) return res.status(404).json({ message: "Member not found" });

  if (member.role === "admin" && role === "member" && adminCount(group) <= 1)
    return res.status(400).json({ message: "At least one admin required" });

  member.role = role;
  await group.save();

  res.json({ message: "Role updated" });
});

/* ─────────────────────────────────────────────
   UPDATE MEMBER TAGS (ADMINS ONLY)
   POST /group/:groupId/tags
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   LEAVE GROUP
   POST /group/:groupId/leave
   - Admin must assign another admin before leaving
───────────────────────────────────────────── */
router.post("/group/:groupId/leave", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const group = await Group.findById(groupId);

  const member = group.members.find(
    (m) => m.userId.toString() === userId.toString(),
  );

  if (!member) return res.status(404).json({ message: "Not a group member" });

  if (member.role === "admin" && adminCount(group) <= 1)
    return res.status(400).json({
      message: "Assign another admin before leaving",
    });

  group.members = group.members.filter(
    (m) => m.userId.toString() !== userId.toString(),
  );

  await group.save();
  res.json({ message: "Left group" });
});

/* ─────────────────────────────────────────────
   DELETE GROUP (ADMINS ONLY)
   DELETE /group/:groupId
───────────────────────────────────────────── */
router.delete("/group/:groupId", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (!isAdmin(group, userId))
    return res.status(403).json({ message: "Admins only" });

  await Group.findByIdAndDelete(groupId);
  res.json({ message: "Group deleted" });
});

module.exports = router;
