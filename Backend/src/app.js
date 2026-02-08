const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

app.use(
  cors({
    origin: [
      "https://devconnect18.onrender.com",
      "https://devconnect18.onrender.com/",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/authRoute");
const profileRouter = require("./routes/profileRoute");
const requestRouter = require("./routes/requestRoute");
const userRouter = require("./routes/userRoute");
const paymentRouter = require("./routes/paymentRoute");
const initializeSocket = require("./utils/socket");
const chatRouter = require("./routes/chatRoute");
const jobRouter = require("./routes/jobRoute");
const groupRouter = require("./routes/groupRoute");

const groupChatRouter = require("./routes/groupChatRoute");

app.use("/", groupChatRouter);

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter);
app.use("/", jobRouter);
app.use("/", groupRouter);

const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    console.log("Database connection established...");
    server.listen(process.env.PORT || 7777, () => {
      console.log(
        `Server is successfully listening on port ${
          process.env.PORT || 7777
        }...`
      );
    });
    
  })
  .catch((err) => {
    console.error("Failed to connect to the database", err);
    process.exit(1);
  });
