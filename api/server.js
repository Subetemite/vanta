require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "joremiodot-api",
    database: "connected-via-mongoose",
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/cases", require("./routes/cases"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/logistics", require("./routes/logistics"));
app.use("/api/operations", require("./routes/operations"));
app.use("/api/social", require("./routes/social"));

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
