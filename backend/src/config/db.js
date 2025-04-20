const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();  // For loading environment variables

const uri = process.env.MONGO_URI; // Load MongoDB URI from environment variables

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB Atlas!");
        return client.db("DiscussAndVote"); 
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
}

module.exports = connectDB;
