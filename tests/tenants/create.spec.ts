import { AppDataSource } from "../../src/config/data-source";
import { DataSource } from "typeorm";
import request from "supertest";
import app from "../../src/app";

describe("POST /tenants", () => {
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
        it("should return a 201 status code", async () => {
            const tenantData = {
                name: "Tenant name",
                address: "Tenant address",
            };
            const response = await request(app)
                .post("/tenants")
                .send(tenantData);

            expect(response.statusCode).toBe(201);
        });
        it("should create a tenant in the database", async () => {});
    });

    describe("Fields are missing", () => {});
});
