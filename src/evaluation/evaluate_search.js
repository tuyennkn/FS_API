import { CONNECT_DB, CLOSE_DB } from '../config/mongoose.js';
import Book from '../models/Book.js';
import { generateEmbedding } from '../services/AI/embedding.service.js';

// --- CẬP NHẬT DATASET VỚI TARGET CHÍNH XÁC ---
const manualQueries = [
    // === NHÓM 1: KINH ĐIỂN & VĂN HỌC ===
    { query: "The Great Gatsby", targetBooks: ["The Great Gatsby"], type: "Exact" },
    { query: "Tiểu thuyết về giấc mơ Mỹ và chàng Gatsby vĩ đại", targetBooks: ["The Great Gatsby"], type: "Semantic" },
    { query: "To Kill a Mockingbird", targetBooks: ["To Kill a Mockingbird"], type: "Exact" },
    { query: "Sách về luật sư Atticus Finch bảo vệ người da đen", targetBooks: ["To Kill a Mockingbird"], type: "Semantic" },
    { query: "Pride and Prejudice", targetBooks: ["Pride and Prejudice"], type: "Exact" },
    { query: "Câu chuyện tình yêu giữa Elizabeth Bennet và ngài Darcy", targetBooks: ["Pride and Prejudice"], type: "Semantic" },
    { query: "1984", targetBooks: ["1984"], type: "Exact" },
    { query: "Tiểu thuyết về xã hội giám sát Big Brother", targetBooks: ["1984"], type: "Semantic" },
    { query: "The Catcher in the Rye", targetBooks: ["The Catcher in the Rye"], type: "Exact" },
    { query: "Tâm sự của chàng trai trẻ Holden Caulfield về sự giả tạo", targetBooks: ["The Catcher in the Rye"], type: "Semantic" },
    { query: "Animal Farm", targetBooks: ["Animal Farm"], type: "Exact" },
    { query: "Truyện ngụ ngôn về các loài vật nổi dậy ở trang trại", targetBooks: ["Animal Farm"], type: "Semantic" },
    { query: "Lord of the Flies", targetBooks: ["Lord of the Flies"], type: "Exact" },
    { query: "Nhóm trẻ em bị lạc trên đảo hoang và trở nên dã man", targetBooks: ["Lord of the Flies"], type: "Semantic" },
    { query: "Of Mice and Men", targetBooks: ["Of Mice and Men"], type: "Exact" },
    { query: "Little Women", targetBooks: ["Little Women"], type: "Exact" },
    { query: "Sách về bốn chị em nhà March trưởng thành", targetBooks: ["Little Women"], type: "Semantic" },
    { query: "Romeo and Juliet", targetBooks: ["Romeo and Juliet"], type: "Exact" },
    { query: "Bi kịch tình yêu của hai dòng họ Montague và Capulet", targetBooks: ["Romeo and Juliet"], type: "Semantic" },
    { query: "The Odyssey", targetBooks: ["The Odyssey"], type: "Exact" },

    // === NHÓM 2: FANTASY & SCI-FI ===
    { query: "Harry Potter and the Sorcerer's Stone", targetBooks: ["Harry Potter and the Sorcerer's Stone"], type: "Exact" },
    { query: "Cậu bé phù thủy sống sót sau lời nguyền", targetBooks: ["Harry Potter and the Sorcerer's Stone"], type: "Semantic" },
    { query: "The Hobbit", targetBooks: ["The Hobbit"], type: "Exact" },
    { query: "Cuộc phiêu lưu của Bilbo Baggins giành lại kho báu", targetBooks: ["The Hobbit"], type: "Semantic" },
    { query: "The Lord of the Rings", targetBooks: ["The Lord of the Rings", "The Fellowship of the Ring"], type: "Exact" },
    { query: "Hành trình tiêu hủy chiếc nhẫn quyền lực tại núi Doom", targetBooks: ["The Lord of the Rings", "The Return of the King", "The Fellowship of the Ring"], type: "Semantic" },
    { query: "Fahrenheit 451", targetBooks: ["Fahrenheit 451"], type: "Exact" },
    { query: "Thế giới tương lai nơi lính cứu hỏa đi đốt sách", targetBooks: ["Fahrenheit 451"], type: "Semantic" },
    { query: "Dune", targetBooks: ["Dune"], type: "Exact" },
    { query: "Tiểu thuyết khoa học viễn tưởng về hành tinh cát Arrakis", targetBooks: ["Dune"], type: "Semantic" },
    { query: "The Hunger Games", targetBooks: ["The Hunger Games"], type: "Exact" },
    { query: "Cô gái tình nguyện thay em gái tham gia trò chơi sinh tử", targetBooks: ["The Hunger Games"], type: "Semantic" },
    { query: "Game of Thrones", targetBooks: ["A Game of Thrones", "A Song of Ice and Fire"], type: "Exact" },
    { query: "Cuộc chiến giành ngôi báu sắt giữa các gia tộc", targetBooks: ["A Game of Thrones"], type: "Semantic" },
    { query: "Ender's Game", targetBooks: ["Ender's Game"], type: "Exact" },
    { query: "The Martian", targetBooks: ["The Martian"], type: "Exact" },
    { query: "Phi hành gia bị bỏ lại một mình trên sao Hỏa trồng khoai tây", targetBooks: ["The Martian"], type: "Semantic" },
    { query: "Brave New World", targetBooks: ["Brave New World"], type: "Exact" },
    { query: "The Hitchhiker's Guide to the Galaxy", targetBooks: ["The Hitchhiker's Guide to the Galaxy"], type: "Exact" },
    { query: "Sách hài hước về du hành vũ trụ và số 42", targetBooks: ["The Hitchhiker's Guide to the Galaxy"], type: "Semantic" },

    // === NHÓM 3: NON-FICTION & SELF-HELP ===
    { query: "Sapiens: A Brief History of Humankind", targetBooks: ["Sapiens"], type: "Exact" },
    { query: "Lịch sử loài người từ thời tiền sử đến hiện đại", targetBooks: ["Sapiens"], type: "Semantic" },
    { query: "Educated", targetBooks: ["Educated"], type: "Exact" },
    { query: "Becoming", targetBooks: ["Becoming"], type: "Exact" },
    { query: "Hồi ký của phu nhân Obama", targetBooks: ["Becoming"], type: "Semantic" },
    { query: "Steve Jobs", targetBooks: ["Steve Jobs"], type: "Exact" },
    { query: "Tiểu sử người sáng lập Apple", targetBooks: ["Steve Jobs"], type: "Semantic" },
    { query: "Quiet: The Power of Introverts", targetBooks: ["Quiet"], type: "Exact" },
    { query: "Sức mạnh của người hướng nội trong thế giới ồn ào", targetBooks: ["Quiet"], type: "Semantic" },
    { query: "Thinking, Fast and Slow", targetBooks: ["Thinking, Fast and Slow"], type: "Exact" },
    { query: "Atomic Habits", targetBooks: ["Atomic Habits"], type: "Exact" },
    { query: "Cách xây dựng thói quen tốt và bỏ thói quen xấu", targetBooks: ["Atomic Habits"], type: "Semantic" },
    { query: "Rich Dad Poor Dad", targetBooks: ["Rich Dad Poor Dad"], type: "Exact" },
    { query: "Sách dạy tư duy tài chính và đầu tư", targetBooks: ["Rich Dad Poor Dad"], type: "Semantic" },
    { query: "How to Win Friends and Influence People", targetBooks: ["How to Win Friends and Influence People"], type: "Exact" },
    { query: "Nghệ thuật thu phục lòng người", targetBooks: ["How to Win Friends and Influence People"], type: "Semantic" },
    { query: "Man's Search for Meaning", targetBooks: ["Man's Search for Meaning"], type: "Exact" },
    { query: "Trải nghiệm trong trại tập trung Đức Quốc xã và liệu pháp ý nghĩa", targetBooks: ["Man's Search for Meaning"], type: "Semantic" },
    { query: "The Diary of a Young Girl", targetBooks: ["The Diary of a Young Girl", "The Diary of Anne Frank"], type: "Exact" },
    { query: "Nhật ký của cô bé Do Thái trốn Đức Quốc xã", targetBooks: ["The Diary of a Young Girl"], type: "Semantic" },

    // === NHÓM 4: ROMANCE & MYSTERY ===
    { query: "The Notebook", targetBooks: ["The Notebook"], type: "Exact" },
    { query: "Câu chuyện tình yêu cảm động của Noah và Allie", targetBooks: ["The Notebook"], type: "Semantic" },
    { query: "Me Before You", targetBooks: ["Me Before You"], type: "Exact" },
    { query: "Gone Girl", targetBooks: ["Gone Girl"], type: "Exact" },
    { query: "Vợ mất tích vào ngày kỷ niệm đám cưới", targetBooks: ["Gone Girl"], type: "Semantic" },
    { query: "The Girl on the Train", targetBooks: ["The Girl on the Train"], type: "Exact" },
    { query: "Da Vinci Code", targetBooks: ["The Da Vinci Code"], type: "Exact" },
    { query: "Giáo sư Langdon giải mã bí mật tôn giáo", targetBooks: ["The Da Vinci Code"], type: "Semantic" },
    { query: "Angels and Demons", targetBooks: ["Angels & Demons"], type: "Exact" },
    { query: "The Godfather", targetBooks: ["The Godfather"], type: "Exact" },
    { query: "Tiểu thuyết về gia đình mafia Ý tại Mỹ", targetBooks: ["The Godfather"], type: "Semantic" },
    { query: "The Shining", targetBooks: ["The Shining"], type: "Exact" },
    { query: "Khách sạn ma ám và người cha phát điên", targetBooks: ["The Shining"], type: "Semantic" },
    { query: "It", targetBooks: ["It"], type: "Exact" },
    { query: "Gã hề ma quái ăn thịt trẻ em", targetBooks: ["It"], type: "Semantic" },
    { query: "Twilight", targetBooks: ["Twilight"], type: "Exact" },
    { query: "Fifty Shades of Grey", targetBooks: ["Fifty Shades of Grey"], type: "Exact" },
    { query: "Outlander", targetBooks: ["Outlander"], type: "Exact" },
    { query: "Cô y tá xuyên không về Scotland thế kỷ 18", targetBooks: ["Outlander"], type: "Semantic" },
    { query: "Fault in Our Stars", targetBooks: ["The Fault in Our Stars"], type: "Exact" },

    // === NHÓM 5: TRỪU TƯỢNG (Khó) ===
    // Ở nhóm này, chúng ta định nghĩa "Target" là những cuốn sách tiêu biểu nhất của thể loại đó
    { query: "sach ve phu thuy", targetBooks: ["Harry Potter", "The Witches", "Discovery of Witches"], type: "Semantic" },
    { query: "truyen trinh tham hay nhat", targetBooks: ["Sherlock Holmes", "Agatha Christie", "Gone Girl", "Da Vinci Code"], type: "Semantic" },
    { query: "tieu thuyet lang man buon", targetBooks: ["The Notebook", "Me Before You", "The Fault in Our Stars", "A Walk to Remember"], type: "Semantic" },
    { query: "sach kinh doanh cho nguoi moi", targetBooks: ["Rich Dad Poor Dad", "Thinking, Fast and Slow", "Zero to One"], type: "Semantic" },
    { query: "books about space travel", targetBooks: ["The Martian", "The Hitchhiker's Guide", "Ender's Game", "Dune"], type: "Semantic" },
    { query: "dystopian novels", targetBooks: ["1984", "Brave New World", "The Hunger Games", "Fahrenheit 451", "The Handmaid's Tale"], type: "Semantic" },
    { query: "war history books", targetBooks: ["The Diary of a Young Girl", "All Quiet on the Western Front", "The Book Thief"], type: "Semantic" },
    { query: "sach hoc lam nguoi", targetBooks: ["How to Win Friends", "Man's Search for Meaning", "Alchemist"], type: "Semantic" },
    { query: "vampire love story", targetBooks: ["Twilight", "Dracula", "Vampire Academy"], type: "Semantic" },
    { query: "best horror books", targetBooks: ["It", "The Shining", "Dracula", "Pet Sematary"], type: "Semantic" },
    { query: "sach ve dau tu chung khoan", targetBooks: ["The Intelligent Investor", "Rich Dad Poor Dad"], type: "Semantic" },
    { query: "classical literature", targetBooks: ["Pride and Prejudice", "The Great Gatsby", "To Kill a Mockingbird", "1984", "Moby Dick"], type: "Semantic" },
    { query: "children books", targetBooks: ["Harry Potter", "The Little Prince", "Charlotte's Web", "Winnie-the-Pooh"], type: "Semantic" },
    { query: "truyen dong vat", targetBooks: ["Animal Farm", "Charlotte's Web", "Call of the Wild", "Black Beauty"], type: "Semantic" },
    { query: "coming of age novels", targetBooks: ["The Catcher in the Rye", "To Kill a Mockingbird", "The Perks of Being a Wallflower"], type: "Semantic" },
    { query: "sach phat trien ban than", targetBooks: ["Atomic Habits", "How to Win Friends", "The Subtle Art"], type: "Semantic" },
    { query: "fantasy world books", targetBooks: ["The Lord of the Rings", "The Hobbit", "Harry Potter", "Game of Thrones"], type: "Semantic" },
    { query: "tieu thuyet lich su", targetBooks: ["The Book Thief", "All the Light We Cannot See", "Pillars of the Earth"], type: "Semantic" },
    { query: "sach triet hoc de doc", targetBooks: ["The Alchemist", "Sophie's World", "Sapiens", "Man's Search for Meaning"], type: "Semantic" },
    { query: "truyen hai huoc", targetBooks: ["The Hitchhiker's Guide to the Galaxy", "Good Omens", "Catch-22"], type: "Semantic" },
];

// Hàm kiểm tra xem kết quả trả về có PHẢI LÀ SÁCH CẦN TÌM không
// Logic: Title của sách trả về phải chứa (hoặc rất giống) Target Book
const calculateMetrics = (results, targetBooks, k = 5) => {
    const topK = results.slice(0, k);
    let isFound = false;
    let rank = 0;

    for (let i = 0; i < topK.length; i++) {
        const resultBook = topK[i];
        
        // Chuẩn hóa tên sách trả về (chữ thường, bỏ khoảng trắng thừa)
        const resultTitleNorm = resultBook.title.toLowerCase().trim();

        // Kiểm tra xem title trả về có match với bất kỳ target nào không
        const match = targetBooks.some(target => {
            const targetNorm = target.toLowerCase().trim();
            // Match nếu tên sách trả về chứa target (VD: "The Great Gatsby (Classic)" chứa "the great gatsby")
            // Hoặc Target chứa tên sách trả về (VD: Target "Harry Potter and the Sorcerer's Stone" match sách "Harry Potter")
            return resultTitleNorm.includes(targetNorm) || targetNorm.includes(resultTitleNorm);
        });

        if (match) {
            isFound = true;
            rank = i + 1;
            break; // Tìm thấy đúng sách rồi thì dừng
        }
    }

    return {
        precision: isFound ? 1 : 0,
        rank: rank
    };
};

const runEvaluation = async () => {
    try {
        await CONNECT_DB();
        console.log("✅ Connected to DB.");
        console.log(`\n🚀 BẮT ĐẦU TEST VỚI ${manualQueries.length} CÂU TRUY VẤN (GROUND TRUTH: TARGET BOOK TITLE)`);
        console.log("============================================================");

        let stats = {
            Exact: { keywordHits: 0, semanticHits: 0, count: 0 },
            Semantic: { keywordHits: 0, semanticHits: 0, count: 0 }
        };

        let index = 0;
        for (const testCase of manualQueries) {
            index++;
            const { query, targetBooks, type } = testCase;
            
            if (index % 10 === 0) console.log(`...Đang xử lý ${index}/${manualQueries.length}: "${query}"`);

            // 1. KEYWORD SEARCH (Regex)
            // Tìm kiếm text thông thường
            const keywordResults = await Book.find({
                $or: [
                    { title: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
                    { description: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
                ]
            }).limit(10);
            
            // Chấm điểm dựa trên Target Book
            const mKey = calculateMetrics(keywordResults, targetBooks, 5);

            // 2. SEMANTIC SEARCH (Vector)
            const queryEmbedding = await generateEmbedding(query);
            const semanticResults = await Book.aggregate([
                {
                    $vectorSearch: {
                        index: "default",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 10,
                    },
                },
                { $project: { title: 1 } }
            ]);
            
            // Chấm điểm dựa trên Target Book
            const mSem = calculateMetrics(semanticResults, targetBooks, 5);

            // 3. Tổng hợp
            if (!stats[type]) stats[type] = { keywordHits: 0, semanticHits: 0, count: 0 };
            
            stats[type].count++;
            stats[type].keywordHits += mKey.precision;
            stats[type].semanticHits += mSem.precision;
        }

        // IN BÁO CÁO
        console.log("\n\n=======================================================");
        console.log(`  KẾT QUẢ ĐÁNH GIÁ (HIT RATE @ TOP 5)`);
        console.log("=======================================================");
        console.log("| Loại Query   | Số lượng | Keyword Match | Semantic Match | Cải thiện |");
        console.log("|---|---|---|---|---|");

        Object.keys(stats).forEach(type => {
            const s = stats[type];
            if (s.count === 0) return;

            const keyRate = (s.keywordHits / s.count * 100).toFixed(1);
            const semRate = (s.semanticHits / s.count * 100).toFixed(1);
            
            let improvement = "0.0";
            let sign = "";
            
            if (s.keywordHits === 0 && s.semanticHits > 0) {
                 improvement = "∞"; 
                 sign = "+";
            } else {
                 improvement = (semRate - keyRate).toFixed(1);
                 sign = improvement >= 0 ? "+" : "";
            }

            console.log(`| ${type.padEnd(12)} | ${s.count.toString().padEnd(8)} | ${keyRate.padEnd(11)}% | ${semRate.padEnd(12)}% | ${sign}${improvement}% |`);
        });

        console.log("\n*Hit Rate: Tỷ lệ tìm thấy ĐÚNG cuốn sách mục tiêu trong top 5.");
        process.exit(0);

    } catch (error) {
        console.error("Lỗi:", error);
        process.exit(1);
    }
};

runEvaluation();