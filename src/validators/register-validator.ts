import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: "Email should be valid",
        },
    },
    firstName: {
        errorMessage: "firstName is required",
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: "Last name is required!",
        notEmpty: true,
        trim: true,
    },
    password: {
        trim: true,
        errorMessage: "password  is required!",
        notEmpty: true,
        isLength: {
            options: {
                min: 8,
            },
            errorMessage: "Password length should be at least 8 chars!",
        },
    },
});

// export default [body("email").notEmpty().withMessage("email is required")];
