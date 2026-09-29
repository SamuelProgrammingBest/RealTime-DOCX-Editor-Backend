const express = require("express")
const { createDoc, getDoc, getDocs, delDoc, downloadDoc } = require("../controllers/document.controller")
const verifyUser = require("../middleware/verifyUser")

const documentRouter = express.Router()

documentRouter.post("/docs", verifyUser, createDoc)
documentRouter.get("/docs", verifyUser, getDocs)
documentRouter.get("/docs/:docId", getDoc)
documentRouter.delete("/docs/:docId", delDoc)
documentRouter.post("/download", downloadDoc)
// documentRouter.post("/login", login)

module.exports = documentRouter