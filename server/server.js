const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("node:dns");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Todo = require("./models/Todo");
const User = require("./models/User");
const auth = require("./middleware/auth");

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,https://your-vercel-app.vercel.app"
)
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);
app.use(express.json());

const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
  enableCustomDns: process.env.ENABLE_CUSTOM_DNS === "true",
  dnsServers: (process.env.DNS_SERVERS || "")
    .split(",")
    .map(server => server.trim())
    .filter(Boolean),
  mongoServerSelectionTimeoutMs:
    Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
  mongoRetryDelayMs: Number(process.env.MONGO_RETRY_DELAY_MS) || 2000,
  mongoMaxRetryDelayMs: Number(process.env.MONGO_MAX_RETRY_DELAY_MS) || 30000,
  mongoConnectMaxRetries: Number(process.env.MONGO_CONNECT_MAX_RETRIES) || 10
};

if (!config.mongoUri) {
  throw new Error("Missing MONGO_URI in environment variables.");
}

if (!config.jwtSecret) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}

if (
  config.enableCustomDns &&
  config.mongoUri.startsWith("mongodb+srv://") &&
  config.dnsServers.length > 0
) {
  dns.setServers(config.dnsServers);
  console.log(`Using custom DNS servers: ${config.dnsServers.join(", ")}`);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const getDbState = () => mongoose.connection.readyState;

let lastDbError = null;
let dbConnectedAt = null;

function getRetryDelayMs(attempt) {
  const exponential = config.mongoRetryDelayMs * Math.pow(2, attempt - 1);
  return Math.min(exponential, config.mongoMaxRetryDelayMs);
}

async function connectToMongoWithRetry() {
  for (let attempt = 1; attempt <= config.mongoConnectMaxRetries; attempt += 1) {
    try {
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: config.mongoServerSelectionTimeoutMs
      });

      dbConnectedAt = new Date();
      lastDbError = null;
      console.log("MongoDB connected.");
      return;
    } catch (err) {
      lastDbError = err;
      console.error(
        `MongoDB connection attempt ${attempt}/${config.mongoConnectMaxRetries} failed:`,
        err.message
      );

      if (err && err.code === "ECONNREFUSED" && err.syscall === "querySrv") {
        console.error(
          "MongoDB SRV DNS lookup failed. Fix DNS resolver/network or use non-SRV Mongo URI."
        );
      }

      if (attempt === config.mongoConnectMaxRetries) {
        throw err;
      }

      const retryDelay = getRetryDelayMs(attempt);
      console.log(`Retrying MongoDB connection in ${retryDelay}ms...`);
      await sleep(retryDelay);
    }
  }
}

mongoose.connection.on("disconnected", () => {
  console.error("MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  dbConnectedAt = new Date();
  lastDbError = null;
  console.log("MongoDB reconnected.");
});

mongoose.connection.on("error", err => {
  lastDbError = err;
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    dbState: getDbState(),
    dbConnected: getDbState() === 1,
    dbConnectedAt
  });
});

app.get("/ready", (_req, res) => {
  if (getDbState() !== 1) {
    return res.status(503).json({
      status: "not_ready",
      dbState: getDbState(),
      error: lastDbError ? lastDbError.message : "Database not connected"
    });
  }

  return res.status(200).json({ status: "ready" });
});

app.get("/", (_req, res) => {
  res.send("Todo API is running");
});

app.post("/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: "7d"
    });

    return res.status(201).json({
      message: "User created successfully",
      token
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: "7d"
    });

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/auth/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ email: user.email });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/auth/change-email", auth, async (req, res) => {
  try {
    const { currentPassword, newEmail } = req.body;
    const normalizedEmail = (newEmail || "").trim().toLowerCase();

    if (!currentPassword || !normalizedEmail) {
      return res.status(400).json({ message: "Current password and new email are required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const emailInUse = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (emailInUse) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    user.email = normalizedEmail;
    await user.save();

    return res.status(200).json({ message: "Email updated successfully", email: user.email });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/auth/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/todos", auth, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.status(200).json(todos);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/todos", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Todo text is required" });
    }

    const todo = await Todo.create({
      text: text.trim(),
      completed: false,
      userId: req.user.userId
    });

    return res.status(201).json(todo);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/todos/:id", auth, async (req, res) => {
  try {
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.status(200).json(updatedTodo);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/todos/:id", auth, async (req, res) => {
  try {
    const deletedTodo = await Todo.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!deletedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.status(200).json(deletedTodo);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.use((req, res) => {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  const status = error?.statusCode || 500;
  return res.status(status).json({
    message: error?.message || "Internal server error"
  });
});

const server = app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

async function startDatabase() {
  try {
    await connectToMongoWithRetry();
  } catch (err) {
    console.error("MongoDB unavailable after retries. Exiting.");
    server.close(() => process.exit(1));
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down.`);
  server.close(async () => {
    try {
      await mongoose.connection.close(false);
    } catch (err) {
      console.error("Error during MongoDB shutdown:", err.message);
    }

    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startDatabase();
