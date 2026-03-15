const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("node:dns");
require("dotenv").config();

const Todo = require("./models/Todo");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-vercel-app.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);
app.use(express.json());

const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
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

// Health and readiness
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

// Test route
app.get("/", (_req, res) => {
  res.send("Todo API is running");
});

// GET ALL TODOS
app.get("/todos", async (_req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE TODO
app.post("/todos", async (req, res) => {
  try {
    const todo = new Todo({
      text: req.body.text,
      completed: false
    });

    const savedTodo = await todo.save();
    res.json(savedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE TODO
app.put("/todos/:id", async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE TODO
app.delete("/todos/:id", async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
    res.json(deletedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
