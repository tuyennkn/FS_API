const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const OUTPUT_DIM = 1024;

const model = genAI.getGenerativeModel({
    model: "gemini-embedding-001"
});

async function generateEmbedding(text) {
    try {
        const result = await model.embedContent({
            content: {
                parts: [{ text }]
            },
            outputDimensionality: OUTPUT_DIM
        });

        return result.embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error("Failed to generate embedding");
    }
}

async function generateBatchEmbeddings(texts) {
    try {
        const embeddings = [];

        for (const text of texts) {
            const result = await model.embedContent({
                content: {
                    parts: [{ text }]
                },
                outputDimensionality: OUTPUT_DIM
            });

            embeddings.push(result.embedding.values);
        }

        return embeddings;
    } catch (error) {
        console.error("Error generating batch embeddings:", error);
        throw new Error("Failed to generate batch embeddings");
    }
}

module.exports = {
    generateEmbedding,
    generateBatchEmbeddings,
};
