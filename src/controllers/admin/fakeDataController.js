/**
 * Admin Controller for fake data generation
 * Provides endpoints for generating test data
 */

import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Book from '../../models/Book.js';
import Comment from '../../models/Comment.js';
import bcrypt from 'bcryptjs';

// Configuration
const TOTAL_USERS = 50;
const TOTAL_ORDERS = 150;
const TOTAL_COMMENTS = 200;
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

const COMMENT_TEMPLATES = [
  'Sách rất hay, nội dung súc tích và dễ hiểu!',
  'Cuốn sách tuyệt vời, mình rất thích!',
  'Đóng gói cẩn thận, giao hàng nhanh. Sách chất lượng tốt.',
  'Nội dung sách rất bổ ích, đáng đọc!',
  'Sách hay nhưng giá hơi cao một chút.',
  'Chất lượng sách tốt, đúng như mô tả.',
  'Rất hài lòng với sản phẩm này!',
  'Giao hàng nhanh, sách còn mới toanh.',
  'Nội dung sâu sắc, rất đáng để suy ngẫm.',
  'Mình đã đọc xong và rất thích!',
  'Sách viết hay, văn phong dễ đọc.',
  'Giá cả hợp lý, chất lượng tốt.',
  'Shop đóng gói cẩn thận, sách không bị hư hỏng.',
  'Nội dung phong phú, nhiều kiến thức mới.',
  'Đọc xong cảm thấy học được nhiều thứ.',
  'Sách đẹp, in ấn rõ ràng.',
  'Rất đáng để mua và đọc!',
  'Nội dung hấp dẫn, khó đặt sách xuống.',
  'Giao hàng đúng hẹn, sản phẩm đẹp.',
  'Sách hay, giá tốt. Sẽ ủng hộ shop tiếp!',
  'Chất lượng giấy in tốt, đọc dễ chịu.',
  'Nội dung như kỳ vọng, rất hài lòng.',
  'Mình rất thích phong cách viết của tác giả.',
  'Sách đến tay còn nguyên vẹn, đẹp.',
  'Đọc sách này giúp mình hiểu thêm nhiều điều.',
  'Rất đáng tiền, sẽ mua thêm các đầu sách khác.',
  'Nội dung chất lượng, trình bày đẹp mắt.',
  'Shop phục vụ tốt, giao hàng nhanh.',
  'Sách hay, đọc rất cuốn.',
  'Giá hợp lý so với chất lượng sách.'
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

// Generate fake comments
const generateFakeComments = async (availableUsers, availableBooks) => {
  try {
    const comments = [];
    
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
        // Positive comments for high ratings
        const positiveComments = COMMENT_TEMPLATES.filter((c, idx) => idx < 25);
        commentText = positiveComments[Math.floor(Math.random() * positiveComments.length)];
      } else if (rating === 3) {
        // Neutral comments
        commentText = 'Sách ổn, nội dung tạm được.';
      } else {
        // Negative/mixed comments for low ratings
        const negativeComments = [
          'Sách không hay như mong đợi.',
          'Nội dung hơi nhàm chán.',
          'Giá hơi cao so với chất lượng.',
          'Không phù hợp với mình lắm.'
        ];
        commentText = negativeComments[Math.floor(Math.random() * negativeComments.length)];
      }
      
      const commentDate = generateRandomDate();
      
      const commentData = {
        book_id: book._id,
        user_id: user._id,
        rating: rating,
        comment: commentText,
        isDisabled: false,
        createdAt: commentDate,
        updatedAt: commentDate
      };
      
      comments.push(commentData);
    }
    
    await Comment.insertMany(comments);
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