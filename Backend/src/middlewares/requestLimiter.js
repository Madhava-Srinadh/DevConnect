const checkRequestLimit = async (req, res, next) => {
  const { status } = req.params;

  // 🔥 Apply limit ONLY for "interested"
  if (status !== "interested") {
    return next();
  }

  const user = req.user;

  const today = new Date().toDateString();
  const lastDate = user.lastRequestDate
    ? new Date(user.lastRequestDate).toDateString()
    : null;

  // Reset count if new day
  if (today !== lastDate) {
    user.dailyRequestCount = 0;
    user.lastRequestDate = new Date();
  }

  let limit = 5; // free
  if (user.membershipType === "silver") limit = 10;
  if (user.membershipType === "gold") return next(); // unlimited

  if (user.dailyRequestCount >= limit) {
    return res.status(403).json({
      message: "Daily interested request limit reached. Upgrade your plan.",
    });
  }

  user.dailyRequestCount += 1;
  await user.save();

  next();
};

module.exports = { checkRequestLimit };
