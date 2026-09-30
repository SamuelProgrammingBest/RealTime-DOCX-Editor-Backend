const AppError = require("../error/errorClass")
const Document = require("../models/document.model")
const { connectRedis } = require("../config/redis")
const cookie = require("cookie");
const jwt = require("jsonwebtoken")
const { Server } = require("socket.io")
const Y = require("yjs")

const savedTimeouts = {};
const titleTimeouts = {};
const activeDocs = new Map();


const getActiveUsers = async (socket, io, redisClient) => {
    if (!socket.docId) return;

    // 1. Fetch current socket entities directly inside the room context
    const socketsInRoom = await io.in(socket.docId).fetchSockets();

    // 2. Rebuild the active Redis set based *only* on currently connected live clients
    const redisKey = `document:${socket.docId}:active`;

    // Clear out stale or disconnected ghost IDs from previous sessions
    await redisClient.del(redisKey);

    if (socketsInRoom.length > 0) {
        // Map out either the authenticated userId or fallback socket.id string securely
        const currentUsers = socketsInRoom.map(s => s.userId ? String(s.userId) : String(s.id));

        // Push the active users into the Redis set
        await redisClient.sAdd(redisKey, currentUsers);
    }

    // 3. Fetch the final updated set from Redis
    const activeUsers = await redisClient.sMembers(redisKey);

    // 4. CRUCIAL FIX: Use io.to() instead of socket.to() so EVERYONE receives the complete layout list
    io.to(socket.docId).emit("active-users", activeUsers);

};


const setupWebsocketConnection = async (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL||"http://localhost:3000",
            credentials: true
        }
    })

    io.use((socket, next) => {
        const rawCookies = socket.handshake.headers.cookie;

        if (!rawCookies) {
            socket.guest = true
            // return next(new AppError("Authentication error: No cookies found"));
            return next()
        }

        // 2. Parse the string into a clean object
        const cookies = cookie.parse(rawCookies);
        const token = cookies.token; // Your cookie name here

        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
            socket.userId = decodedToken.userId
            next()
        } catch (error) {
            next(new AppError("Authentication Error:Invalid Token", 401))
        }
    })

    const redisClient = await connectRedis()

    io.on("connection", socket => {
        socket.on("get_and_join-document", async (docId) => {
            socket.join(docId)
            socket.docId = docId

            await getActiveUsers(socket, io, redisClient)


            if (!activeDocs.has(docId)) {
                const ydoc = new Y.Doc();

                // Fetch initial Base64 from DB and apply to ydoc
                const dbDoc = await Document.findOne({ linkId: docId });
                if (dbDoc?.content) {
                    const base64 = dbDoc.content.replace(/-/g, "+").replace(/_/g, "/");
                    const binaryBuffer = Buffer.from(base64, "base64");
                    Y.applyUpdate(ydoc, new Uint8Array(binaryBuffer));
                }

                // Save to global map so User B can reuse it
                activeDocs.set(docId, ydoc);
            } else {
            }
            // const ydoc = new Y.Doc()
            // savedTimeouts[docId] = 2
            try {
                const document = await Document.findOne({ linkId: docId })
                if (!document) throw new AppError("No document with this link was found", 404)

                // const isOwner = document.owner.equals(socket.userId)
                // const isCollaborator = document.collaborators.some(
                //     id => id.toString() === socket.userId.toString()
                // )

                // // if (!isOwner) {
                // //     return socket.emit("error", "Unauthorized Access to this document")
                // // }


                socket.emit("load-document", document, socket.guest)

                socket.on("typing-changes", async (docId, update) => {
                    const userId = socket.userId

                    // 1. Get the persistent server Y.Doc for this specific document
                    const ydoc = activeDocs.get(docId);
                    if (!ydoc) return;

                    // 2. Apply incoming Uint8Array patch to the server Y.Doc in memory
                    Y.applyUpdate(ydoc, new Uint8Array(update));

                    // 3. Broadcast update to other users in the room
                    socket.to(docId).emit("receive-changes", update);

                    // 4. DEBOUNCE FIX: Clear any existing timer for this document BEFORE setting a new one
                    if (savedTimeouts[docId]) {
                        clearTimeout(savedTimeouts[docId]);
                    }


                    // 5. Schedule a new database save 2 seconds after the LAST keystroke
                    savedTimeouts[docId] = setTimeout(async () => {
                        try {
                            // Consolidate the entire ydoc state into a single Uint8Array
                            const fullStateBinary = Y.encodeStateAsUpdate(ydoc);

                            // Convert raw bytes directly to Base64URL
                            const base64Url = Buffer.from(fullStateBinary)
                                .toString("base64")
                                .replace(/\+/g, "-")
                                .replace(/\//g, "_")
                                .replace(/=+$/, "");

                            // Save full snapshot to MongoDB
                            const updateQuery = {
                                $set: { content: base64Url },
                                $inc: { version: 1 },
                            };

                            // Only update collaborators if userId is valid (prevents null values)
                            if (userId) {
                                updateQuery.$addToSet = { collaborators: userId };
                            }

                            const updatedDoc = await Document.findOneAndUpdate({ linkId: docId }, updateQuery);

                            if (!updatedDoc) {
                                throw new AppError("Failed to update file", 500)
                            }

                            // Clean up timer map entry after saving
                            delete savedTimeouts[docId];
                        } catch (err) {
                        }
                    }, 2000);
                });

                // socket.on("save-document", async (newContent) => {
                //     await Document.findOneAndUpdate(
                //         { linkId: docId },
                //         { content: newContent, $inc: { version: 1 } },
                //     )
                // })


                // await Document.findOneAndUpdate({ linkId: docId }, {collaborators:})
            } catch (error) {
            }


            socket.on("presence-changes", ({ docId, update }) => {
                socket.to(docId).emit("receive-presence", update);
            });




        })



        socket.on("title-change", async (docId, newTitle) => {
            if (!docId) {
                throw new AppError("NO doc Id provided")
            }

            if (titleTimeouts[docId]) {
                clearTimeout(titleTimeouts[docId]);
            }


            // 5. Schedule a new database save 2 seconds after the LAST keystroke
            titleTimeouts[docId] = setTimeout(async () => {
                try {
                    const document = await Document.findOneAndUpdate({ linkId: docId }, { title: newTitle })
                    socket.to(docId).emit("recieved-title", document.title)
                } catch (err) {
                }
            }, 3500);


        })


        socket.on("disconnecting", async () => {
            const targetDocId = socket.docId;

            if (targetDocId) {
                // 1. CRUCIAL: Recalculate remaining users BEFORE this socket officially leaves the room
                const socketsInRoom = await io.in(targetDocId).fetchSockets();

                // Filter out the current disconnecting socket from the calculation
                const remainingSockets = socketsInRoom.filter(s => s.id !== socket.id);

                const redisKey = `document:${targetDocId}:active`;
                await redisClient.del(redisKey);

                if (remainingSockets.length > 0) {
                    // Map the remaining users left behind
                    const remainingUsers = remainingSockets.map(s => s.userId ? String(s.userId) : String(s.id));
                    await redisClient.sAdd(redisKey, remainingUsers);

                    // Fetch updated list and notify everyone else remaining in the room
                    const activeUsers = await redisClient.sMembers(redisKey);
                    io.to(targetDocId).emit("active-users", activeUsers);
                } else {
                    // No one is left in the room
                    io.to(targetDocId).emit("active-users", []);
                }
            }

            // 2. NOW execute the room loops and database flushing safely
            for (const docId of socket.rooms) {
                // Skip socket's own private room ID
                if (docId === socket.id) continue;

                const room = io.sockets.adapter.rooms.get(docId);

                // If this socket was the LAST person in the document room (room size === 1)
                if (room && room.size === 1) {
                    // Clear pending timers
                    if (savedTimeouts[docId]) {
                        clearTimeout(savedTimeouts[docId]);
                        delete savedTimeouts[docId];
                    }

                    if (titleTimeouts[docId]) {
                        clearTimeout(titleTimeouts[docId]);
                        delete titleTimeouts[docId];
                    }

                    // Perform immediate final save to MongoDB
                    const ydoc = activeDocs.get(docId);
                    if (ydoc) {
                        const fullStateBinary = Y.encodeStateAsUpdate(ydoc);
                        const base64Url = Buffer.from(fullStateBinary)
                            .toString("base64")
                            .replace(/\+/g, "-")
                            .replace(/\//g, "_")
                            .replace(/=+\$/, "");

                        await Document.findOneAndUpdate(
                            { linkId: docId },
                            { $set: { content: base64Url } }
                        );

                        // Remove ydoc from memory to prevent leaks
                        activeDocs.delete(docId);
                    }
                }

                // Make the socket leave the room at the very end of the cycle
                socket.leave(docId);
            }
        });


        socket.on("disconnect", async () => {
            // const activeUsers = await redisClient.sMembers(`document:${socket.docId}:active`)

            // socket.to(socket.docId).emit("active-users", activeUsers)
        })

    })

    return io
}


module.exports = { setupWebsocketConnection }