import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    tenantId?: number;
}

export interface RegisterUserRequest extends Request {
    body: UserData;
}

export interface TokenPayload {
    sub: string;
    role: string;
}

export interface AuthRequest extends Request {
    auth: {
        sub: string;
        role: string;
        id?: string;
        tenant: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}
export interface JwtPayloadTen extends JwtPayload {
    auth: {
        sub: string;
        role: string;
        id: number;
        tenant: string;
    };
}
export interface AuthRequestTen extends AuthRequest {
    tenant: string;
}

export interface AuthCookie {
    refreshToken: string;
    accessToken: string;
}

export interface IRefreshTokenPayload {
    id: string;
}

export interface ITenant {
    name: string;
    address: string;
}
export interface CreateTenantRequest extends Request {
    body: ITenant;
}

export interface CreateUserRequest extends Request {
    body: UserData;
}

export interface LimitedUserData {
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    tenantId: number;
}
export interface UpdateUserRequest extends Request {
    body: LimitedUserData;
}

export interface UserQueryParams {
    perPage: number;
    currentPage: number;
    q: string;
    role: string;
}
export interface TenantQueryParams {
    q: string;
    perPage: number;
    currentPage: number;
}
