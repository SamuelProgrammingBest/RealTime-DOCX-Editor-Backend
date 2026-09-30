The robust, real-time backend service for DraftWell, built to handle WebSocket rooms, CRDT state relaying, persistent storage, and background task processing.

🚀 Tech Stack
Runtime & Framework: Node.js, Express.js

Real-Time Communication: Socket.io

State Management: Yjs (Binary update relay & document merging)

Database & Persistence: MongoDB / Mongoose

Caching & Presence: Redis

Deployment: Render


🏗️ Architecture & Core Features
WebSocket Relay & Rooms: Manages live user connections, routing Yjs binary update blobs to peers in the same document room.

CRDT Integration: Receives delta updates from clients and merges them into the existing document state before persisting to MongoDB, preventing data overwrites.

Authentication & Security: Implements secure HTTP-only cookies and guest session handling to protect workspace routes.

Environment Variables
To run this backend locally or deploy it, configure the following environment variables:

Code snippet
PORT=5000
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000

Getting Started (Local Development)
Clone the repository:

Bash
git clone https://github.com/your-username/your-backend-repo.git
cd your-backend-repo
Install dependencies:

Bash
npm install
Set up your .env file using the template above.

Start the development server (make sure your local Redis service is running):

Bash
npm run dev
