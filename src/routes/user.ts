import express, { NextFunction, Request, Response } from "express";

import authenticate from "../middleware/authenticate";
import { canAccess } from "../middleware/canAccess";
import { Roles } from "../constants";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import logger from "../config/logger";
import { User } from "../entity/User";
import { AppDataSource } from "../config/data-source";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);

const userController = new UserController(userService, logger);

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
        await userController.create(req, res, next);
    },
);

export default router;
