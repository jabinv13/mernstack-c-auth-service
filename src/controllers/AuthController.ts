import { NextFunction, Response } from "express";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload } from "jsonwebtoken";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";
import { Roles } from "../constants";
import { Config } from "../config";

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentailService: CredentialService,
    ) {}

    //--------------------------------------------------------//
    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        //Validation
        const result = validationResult(req);
        //there is some errror in the validation array
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { firstName, lastName, email, password } = req.body;

        this.logger.debug("New request to register a user", {
            firstName,
            lastName,
            email,
            password: "******",
        });

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role: Roles.CUSTOMER,
            });

            this.logger.info("user has been registered", { id: user.id });

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
                // add tenant id to the payload
                tenant: user.tenant ? String(user.tenant.id) : "",
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            //Persist the refesh token

            const newRefreshToken =
                await this.tokenService.persistRefrehToken(user);

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            //testing

            res.cookie("accessToken", accessToken, {
                domain: Config.MAIN_DOMAIN,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, //1hr
                httpOnly: true,
            });

            res.cookie("refreshToken", refreshToken, {
                domain: Config.MAIN_DOMAIN,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, //1yr
                httpOnly: true,
            });

            res.status(201).json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }
    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        //Validation

        //there is some errror in the validation array
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { email, password } = req.body;

        this.logger.debug("New request to login user", {
            email,
            password: "******",
        });

        //check if email exist in database
        //compare password
        //generate token == add token to cookies == return response

        try {
            const user = await this.userService.findByEmailWithPassword(email);

            if (!user) {
                const error = createHttpError(
                    400,
                    "Email or password not match",
                );

                next(error);
                return;
            }

            const passwordMatch = await this.credentailService.comparePassword(
                password,
                user.password,
            );
            if (!passwordMatch) {
                const error = createHttpError(
                    400,
                    "Email or password does not match.",
                );
                next(error);
                return;
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
                tenant: user.tenant ? String(user.tenant.id) : "",
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            //Persist the refesh token

            const newRefreshToken =
                await this.tokenService.persistRefrehToken(user);

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            res.cookie("accessToken", accessToken, {
                domain: Config.MAIN_DOMAIN,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, //1hr
                httpOnly: true,
            });

            res.cookie("refreshToken", refreshToken, {
                domain: Config.MAIN_DOMAIN,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, //1yr
                httpOnly: true,
            });

            this.logger.info("User has been logged in", { id: user.id });
            res.json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }

    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req.auth.sub));
        res.json({ ...user, password: undefined });
    }
    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            //generate new access token //adding new refresh token to db

            const payload: JwtPayload = {
                sub: req.auth.sub,
                role: req.auth.role,
                tenant: req.auth.tenant,
                firstName: req.auth.firstName,
                lastName: req.auth.lastName,
                email: req.auth.email,
            };
            const accessToken = this.tokenService.generateAccessToken(payload);

            const user = await this.userService.findById(Number(req.auth.sub));
            if (!user) {
                const error = createHttpError(
                    400,
                    "User with the token could not find",
                );
                next(error);
                return;
            }

            //persisit the refresh token

            const newRefreshToken =
                await this.tokenService.persistRefrehToken(user);

            // Delete old refresh token
            await this.tokenService.deleteRefreshToken(Number(req.auth.id));

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            res.cookie("accessToken", accessToken, {
                domain: Config.MAIN_DOMAIN,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true, // Very important
            });

            res.cookie("refreshToken", refreshToken, {
                domain: Config.MAIN_DOMAIN,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true, // Very important
            });

            this.logger.info("User has been logged in", { id: user.id });
            res.json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
        res.json();
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await this.tokenService.deleteRefreshToken(Number(req.auth.id));
            this.logger.info("Refresh token has been deleted", {
                id: req.auth.id,
            });
            this.logger.info("User has been logged out", { id: req.auth.sub });

            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            res.json({});
        } catch (err) {
            next(err);
            return;
        }
    }
}
