const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("Please Login!");
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyErr) {
      return res.status(400).send("ERROR: " + verifyErr.message);
    }

    const { _id } = decodedObj;
    const user = await User.findById(_id);

    if (!user) {
      return res.status(400).send("ERROR: User not found");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).send("ERROR: " + err.message);
  }
};


module.exports = {
  userAuth,
};
