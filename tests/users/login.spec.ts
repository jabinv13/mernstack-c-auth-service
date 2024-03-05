import { DataSource } from "typeorm";
import bcrypt from "bcrypt";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { isJWt } from "../utils";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
describe("POST /auth/login", () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });
    describe("Given all field", () => {
        it("should return the access token and refresh token inside a cookie", async () => {
            const userData = {
                firstName: "Jabin22",
                lastName: "v",
                email: "jain@mern.auth",
                password: "password",
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password });
            interface Headers {
                ["set-cookie"]: string[];
            }
            // Assert
            let accessToken: string = "";
            let refreshToken: string = "";
            const cookies =
                (response.headers as unknown as Headers)["set-cookie"] || [];
            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                }

                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0].split("=")[1];
                }
            });

            expect(accessToken).not.toBeFalsy();
            expect(refreshToken).not.toBeFalsy();

            expect(isJWt(accessToken)).toBeTruthy();
            expect(isJWt(refreshToken)).toBeTruthy();
        });
    });

    describe("Fields are missing", () => {});
});
