import axios from 'axios';

const BASE_URL = 'http://localhost:8080/router/book';
const ITERATIONS = 20; // Tăng số lần lặp để lấy trung bình chuẩn hơn

const measureLatency = async (url, method, data = {}) => {
    const start = Date.now();
    try {
        await axios({ method, url, data });
        return Date.now() - start;
    } catch (error) {
        return null;
    }
};

const runTest = async (name, url, method, data) => {
    let latencies = [];
    process.stdout.write(`Testing ${name} `);
    
    for (let i = 0; i < ITERATIONS; i++) {
        const lat = await measureLatency(url, method, data);
        if (lat !== null) latencies.push(lat);
        process.stdout.write('.');
    }
    console.log(" Done");
    return latencies;
};

const printStats = (name, latencies) => {
    if (latencies.length === 0) return;
    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = (sum / latencies.length).toFixed(2);
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    // P95 calculation
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    
    console.log(`| ${name} | ${avg} | ${p95} | ${min} | ${max} |`);
};

const runEvaluation = async () => {
    console.log("\n--- PERFORMANCE EVALUATION (20 Iterations) ---");
    console.log("| Operation | Avg (ms) | P95 (ms) | Min | Max |");
    console.log("|---|---|---|---|---|");

    const latKeyword = await runTest("Keyword Search", `${BASE_URL}/search-filters`, 'POST', { search: "Harry" });
    printStats("Keyword Search", latKeyword);

    const latVector = await runTest("Vector Search", `${BASE_URL}/search`, 'POST', { query: "Harry Potter" });
    printStats("Vector Search", latVector);

    // Get Detail Test
    try {
        const allBooks = await axios.get(`${BASE_URL}/all?limit=1`);
        if (allBooks.data.data?.length > 0) {
            const slug = allBooks.data.data[0].slug;
            const latDetail = await runTest("Get Detail", `${BASE_URL}/getBook/${slug}`, 'GET');
            printStats("Get Detail", latDetail);
        }
    } catch (e) {}
};

runEvaluation();
