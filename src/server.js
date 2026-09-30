const express = require("express")
const dotenv = require("dotenv")
dotenv.config()

const http = require("http")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const { connectDB } = require("./config/db")
const userRouter = require("./routes/user.routes")
const documentRouter = require("./routes/document.routes")
const errorHandler = require("./error/errorHandler")
const { setupWebsocketConnection } = require("./sockets/socket.io")
const AppError = require("./error/errorClass")

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL||"http://localhost:3000",
    credentials: true
}))

app.use(cookieParser())
app.use(express.json({ limit: "50mb" }))
app.use("/api/v1", userRouter)
app.use("/api/v1", documentRouter)


app.use(errorHandler)

const port = Number(process.env.PORT) || 4200
const server = http.createServer(app)

const startServer = async () => {
    try {
        await connectDB()

        server.listen(port, () => {
        })

        setupWebsocketConnection(server).catch((err) => {
            console.error(`WebSocket Connection Setup Failed: ${err.message}`);
        })
    } catch (error) {
        process.exitCode = 1
    }
}

server.on("error", (error) => {
    process.exitCode = 1
})

startServer()

const shutdown = async (signal) => {
    console.warn("Server is shutting down with signal: " + signal)
    (await setupWebsocketConnection(server)).disconnectSockets()
    server.close((error) => {
        if (error) {
            process.exitCode = 1
        }
    })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
