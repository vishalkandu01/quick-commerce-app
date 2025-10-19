require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const productRoutes = require("./routes/products");
const adminRoutes = require("./routes/admin");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://54.173.232.149",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "OK" : "Service Unavailable",
    database: dbState === 1 ? "connected" : "disconnected",
  });
});

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);
  socket.on("join_order_room", (orderId) => {
    socket.join(orderId);
    console.log(`Socket ${socket.id} joined room for order ${orderId}`);
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.set("socketio", io);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB.");
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection failed.", err);
    process.exit(1);
  });