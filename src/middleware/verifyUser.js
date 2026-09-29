const jwt = require("jsonwebtoken")
const AppError = require("../error/errorClass")

const verifyUser = (req, res, next) => {
    // const authorization = req.get("Authorization")

    if (!req.cookies.token) {
        return next(new AppError("Authentication token is required", 401))
    }

    if (!process.env.JWT_SECRET_KEY) {
        return next(new AppError("JWT_SECRET_KEY is not configured", 500))
    }

    const token = req.cookies.token

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.user = decodedToken
        return next()
    } catch (error) {
        return next(error)
    }
}

module.exports = verifyUser