import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { CLIENT_URL, NODE_ENV } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());

app.use(cors({
  origin: [CLIENT_URL, "http://localhost:3000", "http://localhost:5173"],
}));

app.use(express.json());

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
