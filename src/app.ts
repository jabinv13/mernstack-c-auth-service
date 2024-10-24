import "reflect-metadata";
import express from "express";

import cookieParser from "cookie-parser";
import tenantRouter from "./routes/tenant";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import cors from "cors";
import { globalErrorHandler } from "./middleware/globalErrorHandler";

const app = express();

app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

app.get("/", async (req, res) => {
    res.send("welocme to auth-service");
});
app.use(
    cors({
        //todo:move to .env file
        origin: [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8000",
        ],
        credentials: true,
    }),
);
app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

app.use(globalErrorHandler);

export default app;
