import express from "express";
import morgan from "morgan";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import apiRouter from "./routes/indexRoutes.js";
import { connectMongoDB } from "./config/configMongoDB.js";
import websockets from "./config/websockets.js";
import "./config/passport-local.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import "dotenv/config";
import "./config/passport-local.js";
import cluster from "cluster";
import os from "os";
import logger from "./utils/logger.js";
import minimist from "minimist"

const argv = minimist(process.argv.slice(2), {default: {puerto:8080, modo:"fork"}, alias:{p:"puerto", m:"modo"}})
const PORT = argv.puerto;
const MODO = argv.modo;
const nroCPUs = os.cpus().length;

if (cluster.isPrimary && MODO === "cluster") {
  console.log(
    `🧮 Primary PID ${process.pid} is running. On port ${PORT}. 🧑‍💻 MODO: ${MODO}.`
  );
  for (let i = 0; i < nroCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  const app = express();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  app.use(morgan("dev"));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(
    cors({
      origin: "*",
      methods: "GET, POST, PUT, DELETE, OPTIONS",
    })
  );

  app.use(
    session({
      secret: "secret",
      resave: true,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 60 * 10,
      }),
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/", (req,res)=>res.redirect("/api/productos"))
  app.use("/api", apiRouter);

  websockets(io);

  connectMongoDB();

  const server = app.listen(process.env.PORT, () =>
    console.log(
      `🚀 Server started on port ${process.env.PORT}. 
       🧑‍🔧 Worker PID: ${process.pid}. 
       🧑‍💻 MODO: ${MODO}.
        at ${new Date().toLocaleString()}`
    )
  );
  server.on("error", (err) => console.log(err));
  io.emit('set-user')
}