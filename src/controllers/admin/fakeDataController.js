/**
 * Admin Controller for fake data generation
 * Provides endpoints for generating test data
 */

import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Book from '../../models/Book.js';
import Comment from '../../models/Comment.js';
import bcrypt from 'bcryptjs';
import { generateEmbedding } from '../../services/AI/embedding.service.js';

// Configuration
const TOTAL_USERS = 50;
const TOTAL_ORDERS = 150;
const TOTAL_COMMENTS = 50;
const DEFAULT_PASSWORD = '123456';

// Vietnamese data
const VIETNAMESE_CITIES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 
  'Nha Trang', 'Hạ Long', 'Vũng Tàu', 'Đà Lạt', 'Huế',
  'Quy Nhon', 'Biên Hòa', 'Thủ Đức', 'Long Xuyên', 'Mỹ Tho'
];

const VIETNAMESE_FIRST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Lưu', 'Trịnh'
];

const VIETNAMESE_LAST_NAMES = [
  'An', 'Bình', 'Chi', 'Dũng', 'Em', 'Giang', 'Hải', 'Khoa', 'Linh', 'Minh',
  'Nam', 'Oanh', 'Phương', 'Quân', 'Sơn', 'Thảo', 'Uyên', 'Văn', 'Xuân', 'Yến'
];

// Comment templates phong phú và chân thật hơn
const POSITIVE_COMMENTS = [
  'Cuốn sách này thực sự hay! Nội dung rất bổ ích và dễ hiểu. Mình đã học được rất nhiều điều mới sau khi đọc xong.',
  'Đọc xong cuốn này mình cảm thấy được truyền cảm hứng rất nhiều. Tác giả viết rất hay và súc tích.',
  'Sách giao đến rất nhanh, đóng gói cẩn thận. Nội dung hay hơn mong đợi, đáng đọc!',
  'Một trong những cuốn sách hay nhất mình từng đọc. Cách tác giả trình bày vấn đề rất logic và dễ hiểu.',
  'Rất hài lòng với cuốn sách này. Văn phong dễ đọc, nội dung phong phú. Chắc chắn sẽ giới thiệu cho bạn bè.',
  'Cuốn sách cung cấp nhiều góc nhìn mới mẻ về chủ đề này. Mình thấy rất thú vị và học được nhiều.',
  'Chất lượng in ấn tốt, giấy dày dặn. Nội dung sách hay, đọc không thấy nhàm. Worth every penny!',
  'Mình mua để tham khảo cho công việc và thấy rất hữu ích. Nhiều ví dụ thực tế dễ áp dụng.',
  'Đọc sách này như được mở ra một thế giới mới. Tác giả viết rất cuốn, khó đặt xuống.',
  'Nội dung sâu sắc nhưng lại được trình bày một cách dễ hiểu. Rất phù hợp cho cả người mới bắt đầu.',
  'Shop đóng gói rất cẩn thận, sách đến tay nguyên vẹn. Nội dung hay như mô tả, sẽ ủng hộ shop tiếp.',
  'Cuốn sách này đã thay đổi cách nhìn của mình về vấn đề. Rất recommend cho ai quan tâm đến chủ đề này.',
  'Mình đã đọc lại 2 lần vì thấy hay quá. Mỗi lần đọc lại đều có những hiểu biết mới.',
  'Tác giả có cách kể chuyện rất hay, không khô khan. Đọc như đang nghe ai đó tâm sự, rất gần gũi.',
  'Giá hợp lý cho một cuốn sách chất lượng như vậy. In ấn đẹp, nội dung hay, đáng để sưu tầm.',
  'Mình rất ấn tượng với cách tác giả phân tích vấn đề. Logic, rõ ràng và có nhiều dẫn chứng thực tế.',
  'Đây là món quà tuyệt vời mình mua tặng bạn. Cả hai đều rất thích nội dung của cuốn sách này.',
  'Sau khi đọc xong, mình đã áp dụng ngay một số lời khuyên trong sách và thấy hiệu quả rõ rệt.',
  'Cuốn sách viết rất chi tiết nhưng không rườm rà. Từng chương đều có nội dung giá trị riêng.',
  'Mình thường ít khi viết review nhưng cuốn này thực sự đáng để giới thiệu. Must read!',
  'Nội dung sách rất thực tế, không viển vông. Tác giả chia sẻ cả những kinh nghiệm thất bại, rất chân thành.',
  'Ban đầu mua vì tò mò, nhưng đọc xong thấy rất bổ ích. Đã recommend cho nhiều người rồi.',
  'Cuốn sách này giúp mình giải đáp được nhiều thắc mắc. Cảm ơn tác giả đã viết cuốn sách hay như vậy.',
  'Rất đáng để đầu tư thời gian đọc. Kiến thức trong sách rất hữu ích cho cả công việc lẫn cuộc sống.',
  'Mình đã highlight rất nhiều đoạn trong sách để đọc lại. Mỗi trang đều có điều đáng học hỏi.',
];

const NEUTRAL_COMMENTS = [
  'Sách có nội dung ổn, phù hợp với một số đối tượng độc giả. Tuy nhiên chưa thực sự nổi bật.',
  'Cuốn sách cung cấp kiến thức cơ bản về chủ đề. Nếu bạn mới tìm hiểu thì có thể đọc thử.',
  'Nội dung tạm được, có một số phần hay nhưng cũng có phần hơi dài dòng.',
  'Sách viết khá dễ hiểu nhưng chưa có nhiều điểm mới mẻ. Phù hợp để đọc giải trí.',
  'Đóng gói tốt, giao hàng đúng hẹn. Nội dung sách cũng khá ổn, không quá xuất sắc nhưng cũng không tệ.',
  'Mình kỳ vọng cao hơn một chút nhưng nhìn chung vẫn OK. Có thể đọc thử nếu quan tâm đến chủ đề.',
  'Sách có một số ý tưởng hay nhưng phần triển khai chưa thực sự thuyết phục.',
  'Chất lượng in ấn tốt, nội dung ở mức trung bình. Đọc được nhưng chưa để lại ấn tượng sâu.',
  'Cuốn sách cung cấp góc nhìn khá thú vị nhưng có thể cần thêm các ví dụ cụ thể hơn.',
  'Giá hơi cao so với nội dung cung cấp. Tuy nhiên nếu bạn quan tâm đến lĩnh vực này thì vẫn đáng đọc.',
];

const NEGATIVE_COMMENTS = [
  'Sách không hay như mình kỳ vọng. Nội dung khá cơ bản, không có nhiều thông tin mới.',
  'Mình thấy nội dung hơi nhàm chán và lặp lại nhiều ý. Có lẽ không phù hợp với mình lắm.',
  'Đọc được nửa chừng thấy hơi khó theo dõi. Cách trình bày chưa được rõ ràng lắm.',
  'Giá hơi cao so với chất lượng nội dung. Nhiều thông tin có thể tìm thấy miễn phí trên mạng.',
  'Sách viết hơi khô khan, thiếu ví dụ thực tế. Đọc xong chưa biết áp dụng như thế nào.',
  'Nội dung không mới mẻ, nhiều ý đã được nhắc đến trong các sách khác. Hơi thất vọng.',
  'Mình mua vì đọc review tốt nhưng thực tế không như mong đợi. Có lẽ không dành cho mình.',
  'Một số phần trong sách hơi dài dòng và không cần thiết. Nên cô đọng hơn.',
  'Sách giao đến bị móp một góc. Về nội dung thì cũng bình thường, chưa thực sự thu hút.',
  'Không phù hợp với trình độ của mình. Có thể phù hợp hơn với người mới bắt đầu.',
];

// Helper functions
const generateVietnamesePhone = () => {
  const prefixes = ['090', '091', '094', '083', '084', '085', '081', '082'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return prefix + suffix;
};

const generateVietnameseName = () => {
  const firstName = VIETNAMESE_FIRST_NAMES[Math.floor(Math.random() * VIETNAMESE_FIRST_NAMES.length)];
  const lastName = VIETNAMESE_LAST_NAMES[Math.floor(Math.random() * VIETNAMESE_LAST_NAMES.length)];
  const middleName = Math.random() > 0.3 ? VIETNAMESE_LAST_NAMES[Math.floor(Math.random() * VIETNAMESE_LAST_NAMES.length)] : '';
  
  return middleName ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
};

const generateShippingAddress = () => {
  const houseNumber = Math.floor(Math.random() * 999) + 1;
  const streets = ['Lê Lợi', 'Nguyễn Huệ', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Điện Biên Phủ'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const district = `Quận ${Math.floor(Math.random() * 12) + 1}`;
  const city = VIETNAMESE_CITIES[Math.floor(Math.random() * VIETNAMESE_CITIES.length)];
  return `${houseNumber} ${street}, ${district}, ${city}`;
};

const generateRandomDate = () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

// Generate fake users
const generateFakeUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const users = [];
    
    for (let i = 0; i < TOTAL_USERS; i++) {
      const fullname = generateVietnameseName();
      const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
      const username = `testuser_${uniqueId}_${i}`;
      const email = `${username}@demo.com`;
      const phone = generateVietnamesePhone();
      const address = generateShippingAddress();
      
      // Generate random birthday (18-65 years old)
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - Math.floor(Math.random() * 47) - 18; // 18-65 years old
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const birthday = new Date(birthYear, birthMonth, birthDay);
      
      // Random gender
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      
      const userData = {
        username,
        fullname,
        email,
        password: hashedPassword,
        phone,
        gender,
        birthday,
        address,
        role: 'user',
        createdAt: generateRandomDate(),
        updatedAt: new Date()
      };
      
      users.push(userData);
    }
    
    const insertedUsers = await User.insertMany(users);
    return insertedUsers;
    
  } catch (error) {
    throw new Error(`Failed to generate fake users: ${error.message}`);
  }
};

// Generate fake orders
const generateFakeOrders = async (availableUsers, availableProducts) => {
  try {
    const orders = [];
    const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
    const PAYMENT_TYPES = ['cash', 'card', 'online'];
    
    for (let i = 0; i < TOTAL_ORDERS; i++) {
      const user = availableUsers[Math.floor(Math.random() * availableUsers.length)];
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = [];
      
      for (let j = 0; j < itemCount; j++) {
        const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        selectedProducts.push(product);
      }
      
      const items = selectedProducts.map(product => {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const basePrice = product.price || Math.floor(Math.random() * 450000) + 50000;
        const variation = 0.9 + Math.random() * 0.2;
        const itemPrice = Math.round(basePrice * variation);
        
        return {
          book_id: product._id,
          quantity: quantity,
          price: itemPrice
        };
      });
      
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingFees = [25000, 30000, 35000, 50000];
      const shippingFee = shippingFees[Math.floor(Math.random() * shippingFees.length)];
      const totalPrice = subtotal + shippingFee;
      
      // Weighted status selection
      const statusWeights = [
        { weight: 5, value: 'pending' },
        { weight: 8, value: 'confirmed' },
        { weight: 10, value: 'processing' },
        { weight: 15, value: 'shipping' },
        { weight: 50, value: 'delivered' },
        { weight: 12, value: 'cancelled' }
      ];
      
      const totalWeight = statusWeights.reduce((sum, item) => sum + item.weight, 0);
      const random = Math.random() * totalWeight;
      let cumulativeWeight = 0;
      let selectedStatus = 'delivered';
      
      for (const item of statusWeights) {
        cumulativeWeight += item.weight;
        if (random <= cumulativeWeight) {
          selectedStatus = item.value;
          break;
        }
      }
      
      const orderDate = generateRandomDate();
      
      const orderData = {
        user_id: user._id,
        items: items,
        total_price: totalPrice,
        shipping_fee: shippingFee,
        shipping_address: generateShippingAddress(),
        shipping_phone_number: generateVietnamesePhone(),
        payment_type: PAYMENT_TYPES[Math.floor(Math.random() * PAYMENT_TYPES.length)],
        status: selectedStatus,
        createdAt: orderDate,
        updatedAt: orderDate
      };
      
      orders.push(orderData);
    }
    
    await Order.insertMany(orders);
    return orders;
    
  } catch (error) {
    throw new Error(`Failed to generate fake orders: ${error.message}`);
  }
};

/**
 * Generate embedding với retry logic
 */
async function generateEmbeddingWithRetry(text, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const embedding = await generateEmbedding(text);
      return embedding;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.warn(`Failed to generate embedding after ${maxRetries} attempts:`, lastError?.message);
  return null;
}

// Generate fake comments với embedding
const generateFakeComments = async (availableUsers, availableBooks) => {
  try {
    console.log(`\nGenerating ${TOTAL_COMMENTS} fake comments with embeddings...`);
    const comments = [];
    let successCount = 0;
    let failedEmbeddings = 0;
    
    for (let i = 0; i < TOTAL_COMMENTS; i++) {
      const user = availableUsers[Math.floor(Math.random() * availableUsers.length)];
      const book = availableBooks[Math.floor(Math.random() * availableBooks.length)];
      
      // Rating distribution: more 4-5 stars, fewer 1-2 stars
      const ratingWeights = [
        { weight: 5, value: 1 },
        { weight: 8, value: 2 },
        { weight: 15, value: 3 },
        { weight: 35, value: 4 },
        { weight: 37, value: 5 }
      ];
      
      const totalWeight = ratingWeights.reduce((sum, item) => sum + item.weight, 0);
      const random = Math.random() * totalWeight;
      let cumulativeWeight = 0;
      let rating = 5;
      
      for (const item of ratingWeights) {
        cumulativeWeight += item.weight;
        if (random <= cumulativeWeight) {
          rating = item.value;
          break;
        }
      }
      
      // Select appropriate comment based on rating
      let commentText;
      if (rating >= 4) {
        // Positive comments for high ratings (4-5 stars)
        commentText = POSITIVE_COMMENTS[Math.floor(Math.random() * POSITIVE_COMMENTS.length)];
      } else if (rating === 3) {
        // Neutral comments (3 stars)
        commentText = NEUTRAL_COMMENTS[Math.floor(Math.random() * NEUTRAL_COMMENTS.length)];
      } else {
        // Negative comments for low ratings (1-2 stars)
        commentText = NEGATIVE_COMMENTS[Math.floor(Math.random() * NEGATIVE_COMMENTS.length)];
      }
      
      const commentDate = generateRandomDate();
      
      // Generate embedding với retry
      console.log(`[${i + 1}/${TOTAL_COMMENTS}] Generating embedding for comment...`);
      const embedding = await generateEmbeddingWithRetry(commentText, 3);
      
      if (embedding) {
        successCount++;
      } else {
        failedEmbeddings++;
        console.warn(`  ⚠ Failed to generate embedding for comment ${i + 1}`);
      }
      
      const commentData = {
        book_id: book._id,
        user_id: user._id,
        rating: rating,
        comment: commentText,
        embedding: embedding, // null nếu thất bại
        isDisabled: false,
        createdAt: commentDate,
        updatedAt: commentDate
      };
      
      comments.push(commentData);
      
      // Delay giữa các requests để tránh rate limit (300ms)
      // Chỉ delay nếu chưa phải comment cuối cùng
      if (i < TOTAL_COMMENTS - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Insert tất cả comments cùng lúc
    await Comment.insertMany(comments);
    
    console.log(`\n✓ Generated ${comments.length} comments`);
    console.log(`  - Embeddings successful: ${successCount}`);
    console.log(`  - Embeddings failed: ${failedEmbeddings}\n`);
    
    return comments;
    
  } catch (error) {
    throw new Error(`Failed to generate fake comments: ${error.message}`);
  }
};

// Main controller functions
export const generateFakeData = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Get available products
    const availableProducts = await Book.aggregate([
      { $sample: { size: 50 } },
      { $project: { _id: 1, title: 1, author: 1, price: 1, image: 1, slug: 1 } }
    ]);

    if (availableProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No books found in database. Please import books first.'
      });
    }

    // Generate fake users
    const newUsers = await generateFakeUsers();
    
    // Get all users for order generation
    const allUsers = await User.find({ role: 'user' }).select('_id fullname email');
    
    // Generate fake orders
    const newOrders = await generateFakeOrders(allUsers, availableProducts);

    // Generate fake comments
    const newComments = await generateFakeComments(allUsers, availableProducts);

    // Generate statistics
    const stats = await generateStatistics();

    res.json({
      success: true,
      message: 'Fake data generated successfully',
      data: {
        usersGenerated: newUsers.length,
        ordersGenerated: newOrders.length,
        commentsGenerated: newComments.length,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Generate fake data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate fake data',
      error: error.message
    });
  }
};

export const getFakeDataStats = async (req, res) => {
  try {
    const stats = await generateStatistics();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get fake data stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};

export const cleanupFakeData = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Delete test users (those with email containing 'demo.com' or 'test.com')
    const deletedUsers = await User.deleteMany({
      role: 'user',
      email: { $regex: /(demo\.com|test\.com|testuser)/ }
    });

    // Delete all orders (or you can be more specific)
    const deletedOrders = await Order.deleteMany({});

    // Delete all comments from deleted test users
    const testUserIds = await User.find({
      role: 'user',
      email: { $regex: /(demo\.com|test\.com|testuser)/ }
    }).select('_id');
    
    const testUserIdArray = testUserIds.map(u => u._id);
    const deletedComments = await Comment.deleteMany({
      user_id: { $in: testUserIdArray }
    });

    res.json({
      success: true,
      message: 'Fake data cleaned up successfully',
      data: {
        usersDeleted: deletedUsers.deletedCount,
        ordersDeleted: deletedOrders.deletedCount,
        commentsDeleted: deletedComments.deletedCount
      }
    });

  } catch (error) {
    console.error('Cleanup fake data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup fake data',
      error: error.message
    });
  }
};

// Generate statistics helper
const generateStatistics = async () => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const activeUsers = totalUsers; // All users are considered active since there's no isActive field
  
  const statusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const paymentCounts = await Order.aggregate([
    { $group: { _id: '$payment_type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const totalRevenue = await Order.aggregate([
    { $match: { status: { $in: ['delivered', 'shipping'] } } },
    { $group: { _id: null, totalRevenue: { $sum: '$total_price' } } }
  ]);
  
  const avgOrderValue = await Order.aggregate([
    { $group: { _id: null, avgValue: { $avg: '$total_price' } } }
  ]);

  // Comments statistics
  const totalComments = await Comment.countDocuments({ isDisabled: false });
  const avgRating = await Comment.aggregate([
    { $match: { isDisabled: false } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);
  
  const ratingDistribution = await Comment.aggregate([
    { $match: { isDisabled: false } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers
    },
    orders: {
      byStatus: statusCounts,
      byPaymentType: paymentCounts,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0,
      averageValue: avgOrderValue.length > 0 ? Math.round(avgOrderValue[0].avgValue) : 0
    },
    comments: {
      total: totalComments,
      averageRating: avgRating.length > 0 ? avgRating[0].avgRating.toFixed(2) : 0,
      byRating: ratingDistribution
    }
  };
};