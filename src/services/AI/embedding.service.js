

const axios = require("axios");

const BASE_URL = process.env.EMBEDDING_API_URL || "http://localhost:8000";

export async function generateEmbedding(text) {
    try {
        const response = await axios.post(`${BASE_URL}/embed`, {
            text: text,
        }, {
            headers: { "Content-Type": "application/json" }
        });

        return response.data.embedding;
    } catch (error) {
        console.error("Error generating embedding:", error.message);
        throw new Error("Failed to generate embedding");
    }
}

export async function generateBatchEmbeddings(texts) {
    try {
        const response = await axios.post(`${BASE_URL}/batch_embed`, {
            texts: texts,
        }, {
            headers: { "Content-Type": "application/json" }
        });
        return response.data.map(item => item.embedding);
    } catch (error) {
        console.error("Error generating batch embeddings:", error.message);
        throw new Error("Failed to generate batch embeddings");
    }
}
