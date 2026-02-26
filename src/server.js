require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const chatRoutes = require("./routes/chat.routes");
const errorMiddleware = require("./middleware/error.middleware");
const initSocket = require("./socket/socket");

const app = express();
const server = http.createServer(app);
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Serve static files (VERY IMPORTANT)
app.use(express.static("public"));

// API routes
app.use("/api/chat", chatRoutes);

// Error middleware (only once, at bottom)
app.use(errorMiddleware);

// Connect DB + Start Server
connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
