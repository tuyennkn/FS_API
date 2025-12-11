import { CONNECT_DB, CLOSE_DB } from '../config/mongoose.js';
import Book from '../models/Book.js';
import Category from '../models/Category.js';
import { analyzeCategoryFromGenre } from '../services/AI/gemini.service.js';

const sleep = (ms) => new Promise(resolve => resolve ? setTimeout(resolve, ms) : null);

const runEvaluation = async () => {
    try {
        await CONNECT_DB();
        console.log("Connected to DB...");

        const SAMPLE_SIZE = 30;
        const books = await Book.aggregate([
            { $match: { genre: { $exists: true, $ne: "" }, category: { $exists: true } } },
            { $sample: { size: SAMPLE_SIZE } }
        ]);

        if (books.length === 0) {
            console.log("No books found.");
            process.exit(0);
        }

        const bookIds = books.map(b => b._id);
        const populatedBooks = await Book.find({ _id: { $in: bookIds } }).populate('category');

        console.log(`\n--- CLASSIFICATION EVALUATION (N=${SAMPLE_SIZE}) ---`);

        let correctCount = 0;
        let totalCount = 0;
        let errors = [];

        console.log("Processing...");

        const RUNS = 1;

        for (const book of populatedBooks) {
            if (!book.category) continue;

            const actualCategory = book.category.name;
            const predictions = [];

            // --- RUN MULTIPLE TIMES WITH DELAY ---
            for (let i = 0; i < RUNS; i++) {
                try {
                    const aiResultRaw = await analyzeCategoryFromGenre(
                        book.genre, 
                        book.title, 
                        book.author
                    );

                    console.log(`AI Raw Result for "${book.title}":`, aiResultRaw);

                    const aiResult = JSON.parse(
                        aiResultRaw.replace(/```json|```/g, '').trim()
                    );

                    predictions.push(aiResult.name);
                } catch (err) {
                    console.log(`Error parsing prediction for book: ${book.title}`);
                }

                // 🛑 ADD DELAY TO AVOID RATE LIMIT
                await sleep(1500); 
            }

            // Count mode
            const frequency = predictions.reduce((acc, label) => {
                acc[label] = (acc[label] || 0) + 1;
                return acc;
            }, {});

            const modeLabel = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0];
            const stability = frequency[modeLabel] / RUNS;

            const isMatch =
                actualCategory.toLowerCase().includes(modeLabel.toLowerCase()) ||
                modeLabel.toLowerCase().includes(actualCategory.toLowerCase());

            if (isMatch) correctCount++;
            else {
                errors.push({
                    title: book.title,
                    actual: actualCategory,
                    predicted: modeLabel,
                    predictions,
                    stability
                });
            }

            totalCount++;
            process.stdout.write(isMatch ? '.' : 'x');
        }

        const accuracy = (correctCount / totalCount) * 100;
        console.log(`\n\nResults:`);
        console.log(`- Total Samples: ${totalCount}`);
        console.log(`- Correct Predictions: ${correctCount}`);
        console.log(`- Accuracy: ${accuracy.toFixed(2)}%`);

        if (errors.length > 0) {
            console.log("\nSample Errors:");
            errors.slice(0, 5).forEach(e => 
                console.log(`  "${e.title}": Actual [${e.actual}] vs Predicted [${e.predicted}]`)
            );
        }

        process.exit(0);
    } catch (error) {
        console.error("Failed:", error);
        process.exit(1);
    }
};

runEvaluation();
