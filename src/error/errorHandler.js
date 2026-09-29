const errorHandler = (error, req, res, next) => {
	let statusCode = error.statusCode || 500
	let message = error.message || "Something went wrong"

	if (error.name === "ValidationError") {
		statusCode = 400
		message = Object.values(error.errors).map((item) => item.message).join(", ")
	}

	if (error.code === 11000) {
		statusCode = 409
		message = "A record with that value already exists"
	}

	if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
		statusCode = 401
		message = "Invalid or expired token"
	}

	const response = { message }

	if (process.env.NODE_ENV !== "production") {
		response.stack = error.stack
	}

	return res.status(statusCode).json(response)
}

module.exports = errorHandler
