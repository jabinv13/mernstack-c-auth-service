import express, {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";

import registerValidator from "../validators/register-validator";
import loginvalidator from "../validators/login-validator";
import { TokenService } from "../services/TokenService";
import { RefreshToken } from "../entity/RefreshToken";
import { CredentialService } from "../services/CredentialService";
import authenticate from "../middleware/authenticate";
import { AuthRequest } from "../types";
import validateRefreshToken from "../middleware/validateRefreshToken";
import parseRefreshToken from "../middleware/parseRefreshToken";

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

const userService = new UserService(userRepository);
const tokenService = new TokenService(refreshTokenRepository);
const credentailService = new CredentialService();
const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentailService,
);

router.post(
    "/register",
    registerValidator,
    (async (req: Request, res: Response, next: NextFunction) =>
        await authController.register(req, res, next)) as RequestHandler,
);

router.post(
    "/login",
    loginvalidator,
    (async (req: Request, res: Response, next: NextFunction) =>
        await authController.login(req, res, next)) as RequestHandler,
);

router.get(
    "/self",
    authenticate,
    (async (req: Request, res: Response) =>
        await authController.self(req as AuthRequest, res)) as RequestHandler,
);
router.post(
    "/refresh",
    validateRefreshToken,
    (async (req: Request, res: Response, next: NextFunction) =>
        await authController.refresh(
            req as AuthRequest,
            res,
            next,
        )) as RequestHandler,
);

router.post(
    "/logout",
    parseRefreshToken,
    (async (req: Request, res: Response, next: NextFunction) =>
        await authController.logout(
            req as AuthRequest,
            res,
            next,
        )) as RequestHandler,
);

export default router;
