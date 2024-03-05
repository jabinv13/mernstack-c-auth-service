import express, { NextFunction, Response } from "express";
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

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: CreateTenantRequest, res: Response, next: NextFunction) => {
        await tenantController.create(req, res, next);
    },
);

router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: CreateTenantRequest, res: Response, next: NextFunction) => {
        await tenantController.update(req, res, next);
    },
);
router.get("/", (req, res, next) => tenantController.getAll(req, res, next));
router.get("/:id", (req, res, next) => tenantController.getOne(req, res, next));
router.delete(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    (req, res, next) => tenantController.destroy(req, res, next),
);

export default router;
