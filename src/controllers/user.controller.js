const { createUser, loginUser, getLoggedInUserService } = require("../services/user.services")

const signUp = async (req, res) => {
    if (!req.body) {
        return res.status(401).send("Nothing dey")
    }
    const result = await createUser(req.body)

    const { token } = result

    res.cookie('token', token, {
        httpOnly: true, // Prevents client-side JS from reading the cookie (protects against XSS)
        secure: true, // Ensures cookie is only sepnt over HTTPS
        sameSite: 'none', // Protects against CSRF attacks
        maxAge: 3600000 // 1 hour in milliseconds
    });
    return res.status(201).json(result)
}

const login = async (req, res) => {
    const result = await loginUser(req.body)

    const { token } = result

    res.cookie('token', token, {
        httpOnly: true, // Prevents client-side JS from reading the cookie (protects against XSS)
        secure: true, // Ensures cookie is only sent over HTTPS
        sameSite: 'none', // Protects against CSRF attacks
        maxAge: 3600000 // 1 hour in milliseconds
    });

    return res.status(200).json(result)
}

const getLoggedInUser = async (req, res) => {

    const { userId } = req.user

    const result = await getLoggedInUserService(userId)

    return res.status(200).json(result)
}

module.exports = { signUp, login, getLoggedInUser }