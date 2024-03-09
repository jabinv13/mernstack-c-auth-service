import express, { NextFunction, RequestHandler, Response } from "express";
import { TenantController } from "../controllers/TenantController";
import { TenantService } from "../services/TenantService";
import logger from "../config/logger";
import { AppDataSource } from "../config/data-source";
import { Tenant } from "../entity/Tenant";
import { CreateTenantRequest } from "../types";
import authenticate from "../middleware/authenticate";
import { canAccess } from "../middleware/canAccess";
import { Roles } from "../constants";

const router = express.Router();

const tenantRepository = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantService, logger);

router.post("/", authenticate, canAccess([Roles.ADMIN]), (async (
    req: CreateTenantRequest,
    res: Response,
    next: NextFunction,
) => {
    await tenantController.create(req, res, next);
}) as RequestHandler);

router.patch("/:id", authenticate, canAccess([Roles.ADMIN]), (async (
    req: CreateTenantRequest,
    res: Response,
    next: NextFunction,
) => {
    await tenantController.update(req, res, next);
}) as RequestHandler);
router.get(
    "/",
    (async (req, res, next) =>
        await tenantController.getAll(req, res, next)) as RequestHandler,
);
router.get(
    "/:id",
    (async (req, res, next) =>
        await tenantController.getOne(req, res, next)) as RequestHandler,
);
router.delete(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    (async (req, res, next) =>
        await tenantController.destroy(req, res, next)) as RequestHandler,
);

export default router;
