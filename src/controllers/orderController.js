import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginated,
} from "../utils/responseHelper.js";
import { OrderDTO } from "../dto/index.js";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../utils/constants.js";

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { 
      payment_type, 
      shipping_fee, 
      shipping_address, 
      shipping_phone_number 
    } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ user_id: userId }).populate('items.product', 'price quantity');
    
    if (!cart || cart.items.length === 0) {
      return sendError(res, "Cart is empty", 400);
    }
    
    // Validate stock availability
    for (const item of cart.items) {
      if (item.product.quantity < item.quantity) {
        return sendError(res, `Insufficient stock for ${item.product.title}`, 400);
      }
    }
    
    // Create order items
    const orderItems = cart.items.map(item => ({
      book_id: item.product._id,
      quantity: item.quantity,
      price: item.product.price
    }));
    
    const total_price = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order
    const orderData = {
      user_id: userId,
      items: orderItems,
      total_price,
      shipping_fee: shipping_fee || 30000, // Default 30k VND
      shipping_address: shipping_address,
      shipping_phone_number: shipping_phone_number,
      payment_type: payment_type || 'cash',
      status: 'pending'
    };
    
    const order = new Order(orderData);
    await order.save();
    
    // Update book quantities
    for (const item of cart.items) {
      await Book.findByIdAndUpdate(item.product._id, {
        $inc: { 
          quantity: -item.quantity,
          sold: item.quantity 
        }
      });
    }
    
    // Clear cart
    cart.items = [];
    cart.total_price = 0;
    cart.total_items = 0;
    await cart.save();
    
    // Populate order for response
    await order.populate('items.book_id', 'title author image slug');
    
    const responseData = OrderDTO.toResponse(order);
    return sendCreated(res, responseData, "Order created successfully");
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Create order directly (without cart)
const createDirectOrder = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orderData = OrderDTO.fromCreateRequest(req.body);
    orderData.user_id = userId;
    
    // Validate stock availability
    for (const item of orderData.items) {
      const book = await Book.findById(item.book_id);
      if (!book || book.isDisable) {
        return sendNotFound(res, `Book not found`);
      }
      if (book.quantity < item.quantity) {
        return sendError(res, `Insufficient stock for ${book.title}`, 400);
      }
    }
    
    const order = new Order(orderData);
    await order.save();
    
    // Update book quantities
    for (const item of orderData.items) {
      await Book.findByIdAndUpdate(item.book_id, {
        $inc: { 
          quantity: -item.quantity,
          sold: item.quantity 
        }
      });
    }
    
    // Populate order for response
    await order.populate('items.book_id', 'title author image slug');
    
    const responseData = OrderDTO.toResponse(order);
    return sendCreated(res, responseData, "Order created successfully");
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    console.log('Getting orders for user:', userId);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({ user_id: userId })
      .populate({
        path: 'items.book_id',
        select: 'title author image slug',
        options: { strictPopulate: false } // Allow missing references
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${orders.length} orders for user ${userId}`);
    
    const total = await Order.countDocuments({ user_id: userId });
    
    const responseData = OrderDTO.toListResponse(orders);
    return sendPaginated(res, responseData, page, limit, total, SUCCESS_MESSAGES.DATA_RETRIEVED);
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const order = await Order.findOne({ _id: id, user_id: userId })
      .populate('items.book_id', 'title author image slug price');
    
    if (!order) {
      return sendNotFound(res, "Order not found");
    }
    
    const responseData = OrderDTO.toResponse(order);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.DATA_RETRIEVED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;
    
    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }
    
    // Search functionality (by user email/name or order ID)
    if (search) {
      // First, find users matching the search term
      const users = await User.find({
        $or: [
          { fullname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      query.$or = [
        { user_id: { $in: userIds } },
        { _id: { $regex: search, $options: 'i' } }
      ];
    }
    
    const orders = await Order.find(query)
      .populate('user_id', 'email fullname')
      .populate('items.book_id', 'title author image slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments(query);
    
    const responseData = orders.map(order => OrderDTO.toResponse(order));
    return sendPaginated(res, responseData, page, limit, total, SUCCESS_MESSAGES.DATA_RETRIEVED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('user_id', 'email fullname')
      .populate('items.book_id', 'title author image slug');
    
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    
    const responseData = OrderDTO.toResponse(order);
    return sendSuccess(res, responseData, 'Order status updated successfully');
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

export { 
  createOrder, 
  createDirectOrder, 
  getUserOrders, 
  getOrderById, 
  getAllOrders,
  updateOrderStatus
};