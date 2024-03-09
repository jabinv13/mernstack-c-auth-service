import express, {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from "express";

import authenticate from "../middleware/authenticate";
import { canAccess } from "../middleware/canAccess";
import { Roles } from "../constants";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import logger from "../config/logger";
import { User } from "../entity/User";
import { AppDataSource } from "../config/data-source";
import createUserValidator from "../validators/create-user-validator";
import updateUserValidator from "../validators/update-user-validator";
import { UpdateUserRequest } from "../types";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService, logger);

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    createUserValidator,
    (async (req: Request, res: Response, next: NextFunction) => {
        await userController.create(req, res, next);
    }) as RequestHandler,
);

router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    updateUserValidator,
    (async (req: UpdateUserRequest, res: Response, next: NextFunction) =>
        await userController.update(req, res, next)) as RequestHandler,
);

router.get(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    (async (req, res, next) =>
        await userController.getAll(req, res, next)) as RequestHandler,
);

router.get(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    (async (req, res, next) =>
        await userController.getOne(req, res, next)) as RequestHandler,
);

router.delete(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    (async (req, res, next) =>
        await userController.destroy(req, res, next)) as RequestHandler,
);

export default router;
