import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from 'path';

import { PORT, connectMongoDB } from "./config";
import http from "http";
import { UserRouter } from "./routes";
import rateLimit from "express-rate-limit";

// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectMongoDB();

// Create an instance of the Express application
const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  // delayMs: 0 // Disable delaying - full speed until the max limit is reached
});

// Apply rate limiting to /api endpoints
app.use('/api', limiter); 

// Store blocked IP addresses
const blockedIPs = ['192.168.23.13', '172.16.1.1', '51.75.188.0'];

// Store Whitelist IP addresses
const whitelistIPs = ['146.19.215.121'];

// Set up Cross-Origin Resource Sharing (CORS) options
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, './public')));

// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// app.use((req, res, next) => {
//   console.log("req.ip ==> ", req.ip?.replace("::ffff:", ""));
//   // @ts-ignore
//   if (blockedIPs.includes(req.ip?.replace("::ffff:", ""))) {
//     return res.status(403).send('Forbidden');
//   }
//   next();
// });

app.use((req, res, next) => {
  console.log("req.ip ==> ", req.ip?.replace("::ffff:", ""));
  // @ts-ignore
  if (!whitelistIPs.includes(req.ip?.replace("::ffff:", ""))) {
    return res.status(403).send('This IP address is not allowed to request backend.');
  }
  next();
});

const server = http.createServer(app);

// Define routes for different API endpoints
app.use("/api/users", UserRouter);

// Define a route to check if the backend server is running
app.get("/", async (req: any, res: any) => {
  res.send("Backend Server is Running now!");
});

// Start the Express server to listen on the specified port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
