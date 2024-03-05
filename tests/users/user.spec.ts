import { DataSource } from "typeorm";
import bcrypt from "bcrypt";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { isJWt } from "../utils";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import createJWKSMock from "mock-jwks";
describe("GET /auth/self", () => {
    let jwks: ReturnType<typeof createJWKSMock>;
    let connection: DataSource;
    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(async () => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });
    describe("Given all field", () => {
        it("should return the 200 status code", async () => {
            const accessToken = jwks.token({
                sub: "44",
                role: Roles.CUSTOMER,
            });
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();
            expect(response.statusCode).toBe(200);
        });
        it("should return the user data", async () => {
            const userData = {
                firstName: "Jabin22",
                lastName: "v",
                email: "jain@mern.auth",
                password: "password",
            };
            const userRepository = connection.getRepository(User);

            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();

            expect((response.body as Record<string, string>).id).toBe(data.id);
        });

        it("should not return the password field", async () => {
            const userData = {
                firstName: "Jabin22",
                lastName: "v",
                email: "jain@mern.auth",
                password: "password",
            };

            //save data to the database
            const userRepository = connection.getRepository(User);

            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            //Generate token

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            //add token to cookie

            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send();
            expect(response.body as Record<string, string>).not.toHaveProperty(
                "password",
            );
        });
        it("should return 401 status code if token does not exists", async () => {
            // Register user
            const userData = {
                firstName: "Jabin22",
                lastName: "v",
                email: "jain@mern.auth",
                password: "password",
            };
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            // Add token to cookie
            const response = await request(app).get("/auth/self").send();
            // Assert
            expect(response.statusCode).toBe(401);
        });
    });

    describe("Fields are missing", () => {});
});
