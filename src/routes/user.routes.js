const express = require("express")
const { signUp, login, getLoggedInUser } = require("../controllers/user.controller")
const verifyUser = require("../middleware/verifyUser")

const userRouter = express.Router()

userRouter.post("/signup", signUp)
userRouter.post("/login", login)
userRouter.get("/me", verifyUser, getLoggedInUser)

module.exports = userRouter