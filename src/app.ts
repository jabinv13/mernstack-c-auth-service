import "reflect-metadata";
import express from "express";

import cookieParser from "cookie-parser";
import tenantRouter from "./routes/tenant";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import cors from "cors";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { Config } from "./config";

const app = express();

const ALLOWED_DOMAINS = [Config.CLIENT_UI_DOMAIN, Config.ADMIN_UI_DOMAIN];

app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

app.use(cors({ origin: ALLOWED_DOMAINS as string[] }));
app.get("/", async (req, res) => {
    res.send("welocme to auth-service");
});
app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

app.use(globalErrorHandler);

export default app;
