const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI,)

    } catch (error) {
        throw new Error(error.message)
    }
}


module.exports = { connectDB }