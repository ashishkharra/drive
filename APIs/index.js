const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { google } = require("googleapis");
const session = require('express-session');
const MongoStore = require("connect-mongo");
const cors = require("cors");
const mongoose = require('mongoose');
const router = require('./routes/auth.route.js');
require("dotenv").config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const uri = process.env.MONGO_URI;
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_PORT, credentials: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: uri,
        collectionName: "sessions",
        ttl: 60 * 60,
        autoRemove: "native"
    }),
    cookie: {
        secure: isProduction, // Secure only in production (HTTPS)
        httpOnly: true,
        sameSite: isProduction ? 'strict' : 'lax', // 'strict' in prod, 'lax' for local dev
        maxAge: 1000 * 60 * 60,
    }
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_PORT,
        methods: ["GET", "POST"],
        credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 60000
});


const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/documents"],
});

async function getDocsClient() {
    const authClient = await auth.getClient();
    return google.docs({ version: "v1", auth: authClient });
}

mongoose
    .connect(uri)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));

// WebSocket Connection
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);


    socket.on("join-document", (docId) => {
        console.log(`User joined document: ${docId}`);
        socket.join(docId);
    });
    socket.on('send-changes', async({ docId, content }) => {
        console.log(docId, '\n', content)
        content = content.replace(/\n{3,}/g, "\n\n");
        await updateGoogleDocContent(docId, content);
    })
    // Update Google Docs

    return () => {
        socket.off("send-changes", handleReceiveChanges);
    };
});


// Update content in Google Docs
async function updateGoogleDocContent(docId, newText, io) {
    try {
        const docs = await getDocsClient();

        // Fetch existing document content
        const response = await docs.documents.get({ documentId: docId });

        let lastIndex = 1; // Default position
        if (response.data.body.content) {
            const content = response.data.body.content;
            lastIndex = content[content.length - 1]?.endIndex || 1; // Get last cursor position

            lastIndex = Math.max(1, lastIndex - 1);
        }

        // Delete previous text (excluding last newline)
        if (lastIndex > 1) {
            await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: {
                    requests: [
                        {
                            deleteContentRange: {
                                range: { startIndex: 1, endIndex: lastIndex }, // Adjusted delete range
                            },
                        },
                    ],
                },
            });
        }

        // Insert new text at the correct position
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: { index: 1 },
                            text: newText,
                        },
                    },
                ],
            },
        });

        console.log(`Updated Google Doc (${docId}) successfully!`);

    } catch (err) {
        console.error("Error updating Google Doc:", err);
    }
}



app.use('/api', router)

server.listen(3000, () => console.log("Server running on port 3000"));
module.exports = auth