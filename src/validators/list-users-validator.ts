import { checkSchema } from "express-validator";

export default checkSchema(
    {
        q: {
            trim: true,
            customSanitizer: {
                options: (value: unknown) => {
                    return value ? value : "";
                },
            },
        },
        role: {
            customSanitizer: {
                options: (value: unknown) => {
                    return value ? value : "";
                },
            },
        },

        currentPage: {
            customSanitizer: {
                options: (value) => {
                    //check for the query params value and assign defauly if someting else or Nan or undefined
                    const parsedValue = Number(value);
                    return Number.isNaN(parsedValue) ? 1 : parsedValue;
                },
            },
        },
        perPage: {
            customSanitizer: {
                options: (value) => {
                    const parsedValue = Number(value);
                    return Number.isNaN(parsedValue) ? 6 : parsedValue;
                },
            },
        },
    },
    ["query"],
);
