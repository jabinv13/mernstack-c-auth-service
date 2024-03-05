import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { User } from "../../src/entity/User";
import { AppDataSource } from "../../src/config/data-source";
import { Roles } from "../../src/constants";
import { isJWt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";
// import { truncateTables } from "../utils";

describe("POST /auth/register", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // Database truncate
        // await truncateTables(connection);
        // Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return 201 status code", async () => {
            const userData = {
                firstName: "Jabin22",
                lastName: "v",
                email: "jain@mern.auth",
                password: "password",
            };

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //ASSERT

            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "jain@mern.auth",
                password: "password",
            };

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert application/json utf-8

            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should persist the user in the database ", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "jabinv@mern.auth",
                password: "password",
            };

            //ACT

            await request(app).post("/auth/register").send(userData);

            //assert

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(1);
        });

        it("should return an id of the created user ", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "jabinv@mern.auth",
                password: "password",
            };

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //assert
            expect(response.body).toHaveProperty("id");
            const repository = connection.getRepository(User);
            const users = await repository.find();
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            );
        });

        it("should assign a customer role", async () => {
            const userData = {
                firstName: "Jabin77",
                lastName: "v",
                email: "jabinv@mern.auth",
                password: "password",
            };

            //ACT

            await request(app).post("/auth/register").send(userData);

            //ASSERT
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users[0]).toHaveProperty("role");
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it("should store the hashed password in the database ", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "jabinv2@mern.auth",
                password: "password",
            };

            //ACT

            await request(app).post("/auth/register").send(userData);

            // ASSERT

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find({ select: ["password"] });
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2[a|b]\$\d+\$/);
        });

        it("should return 400 status code if email is already exist", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "jabinv@mern001.auth",
                password: "password",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            const users = await userRepository.find();

            //ASSERT

            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
        it("should return the access token and refresh token inside a cookie", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "jabinv@mern001.auth",
                password: "password",
            };

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //ASSERT

            interface Headers {
                ["set-cookie"]: string[];
            }

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

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();

            expect(isJWt(accessToken)).toBeTruthy();
            expect(isJWt(refreshToken)).toBeTruthy();
        });

        it("should store the refresh token in the database ", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "jabinv@mern001.auth",
                password: "password",
            };

            //ACT

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            //ASSERT

            const refreshTokenRepository =
                connection.getRepository(RefreshToken);

            const tokens = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany();
            // const refreshTokens = await refreshTokenRepository.find();

            expect(tokens).toHaveLength(1);
        });
    });

    describe("Fields are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "",
                password: "password",
            };

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //ASSERT

            expect(users).toHaveLength(0);
        });
        it("should return 400 status code if firstName field is missing", async () => {
            const userData = {
                firstName: "",
                lastName: "v",
                email: "jaabin@mern.auth",
                password: "password",
            };

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //ASSERT

            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if lastName field is missing", async () => {
            const userData = {
                firstName: "jabin",
                lastName: "",
                email: "jaabin@mern.auth",
                password: "password",
            };

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //ASSERT

            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if password field is missing", async () => {
            const userData = {
                firstName: "jabin",
                lastName: "v",
                email: "jaabin@mern.auth",
                password: "",
            };

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            //ASSERT

            expect(users).toHaveLength(0);
        });
    });

    describe("fields are not in proper format", () => {
        it("should trim the email field", async () => {
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: " jabinv@mern001.auth ",
                password: "password",
            };

            //ACT

            await request(app).post("/auth/register").send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            const user = users[0];

            expect(user.email).toBe("jabinv@mern001.auth");
        });
        it("should return 400 status code if email is not a valid email", async () => {
            // Arrange
            const userData = {
                firstName: "Jabin",
                lastName: "v",
                email: "jabin_mern.space", // Invalid email
                password: "password",
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
        it("should return 400 status code if password length is less than 8 chars", async () => {
            // Arrange
            const userData = {
                firstName: "Rakesh",
                lastName: "K",
                email: "rakesh@mern.space",
                password: "pass", // less than 8 chars
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
        it("shoud return an array of error messages if email is missing", async () => {
            // Arrange
            const userData = {
                firstName: "Rakesh",
                lastName: "K",
                email: "",
                password: "password",
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.body).toHaveProperty("errors");
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0);
        });
    });
});
