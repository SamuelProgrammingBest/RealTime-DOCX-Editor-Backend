const User = require("../models/user.model")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const AppError = require("../error/errorClass")

const createToken = (userId) => {
    if (!process.env.JWT_SECRET_KEY) {
        throw new AppError("JWT_SECRET_KEY is not configured")
    }

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
    )
}

const publicUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email
})

const createUser = async (body) => {
    const { username, email, password } = body

    if (!username || !email || !password) {
        throw new AppError("Username, email, and password are required", 400)
    }

    if (password.length < 8) {
        throw new AppError("Password must be at least 8 characters", 400)
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
        throw new AppError("Email is already registered", 401)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({
        username: username.trim(),
        email: normalizedEmail,
        password: hashedPassword
    })

    return { user: publicUser(newUser), token: createToken(newUser._id) }
}

const loginUser = async (body) => {
    const { email, password } = body

    if (!email || !password) {
        throw new AppError("Email and password are required", 400)
    }

    const foundUser = await User.findOne({ email: email.trim().toLowerCase() }).select("+password")

    if (!foundUser) {
        throw new AppError("Invalid email or password", 401)
    }

    const comparedPassword = await bcrypt.compare(password, foundUser.password)

    if (!comparedPassword) {
        throw new AppError("Invalid email or password", 401)
    }

    return { user: publicUser(foundUser), token: createToken(foundUser._id) }
}

const getLoggedInUserService = async (userId) => {
    const foundUser = await User.findById(userId)

    if (!foundUser) {
        throw new AppError("User does not exist", 403)
    }
    return publicUser(foundUser)
}

module.exports = {
    createUser,
    loginUser,
    getLoggedInUserService
}