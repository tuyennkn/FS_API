import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
} from "../utils/responseHelper.js";
import { CartDTO } from "../dto/index.js";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../utils/constants.js";

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ user_id: userId }).populate('items.product', 'title author price image slug quantity');
    
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
      await cart.save();
    }
    
    const responseData = CartDTO.toResponse(cart);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.DATA_RETRIEVED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = CartDTO.fromAddItemRequest(req.body);
    
    // Validate book exists and is available
    const book = await Book.findById(product_id);
    if (!book || book.isDisable) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    // check cart quantity + new quantity <= book quantity
    const userCart = await Cart.findOne({ user_id: userId });
    const existingCartItem = userCart ? userCart.items.find(item => item.product.toString() === product_id) : null;
    const existingQuantity = existingCartItem ? existingCartItem.quantity : 0;

    if (book.quantity < quantity + existingQuantity) {
      return sendError(res, "Insufficient stock", 400);
    }
    
    let cart = await Cart.findOne({ user_id: userId });
    
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === product_id
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({ product: product_id, quantity });
    }
    
    // Calculate total price
    await cart.populate('items.product', 'price');
    cart.total_price = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.product', 'title author price image slug quantity');
    
    const responseData = CartDTO.toResponse(cart);
    return sendSuccess(res, responseData, "Item added to cart");
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Update item quantity in cart
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = CartDTO.fromUpdateItemRequest(req.body);
    
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return sendNotFound(res, "Cart not found");
    }
    
    // Validate book exists and is available
    const book = await Book.findById(product_id);
    if (!book || book.isDisable) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    const userCart = await Cart.findOne({ user_id: userId });
    const existingCartItem = userCart ? userCart.items.find(item => item.product.toString() === product_id) : null;
    const existingQuantity = existingCartItem ? existingCartItem.quantity : 0;

    if (book.quantity < quantity + existingQuantity - (existingCartItem ? existingCartItem.quantity : 0)) {
      return sendError(res, "Insufficient stock", 400);
    }
    
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === product_id
    );
    
    if (itemIndex === -1) {
      return sendNotFound(res, "Item not found in cart");
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }
    
    // Calculate total price
    await cart.populate('items.product', 'price');
    cart.total_price = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.product', 'title author price image slug quantity');
    
    const responseData = CartDTO.toResponse(cart);
    return sendSuccess(res, responseData, "Cart updated");
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.params;
    
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return sendNotFound(res, "Cart not found");
    }
    
    cart.items = cart.items.filter(item => item.product.toString() !== product_id);
    
    // Calculate total price
    await cart.populate('items.product', 'price');
    cart.total_price = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    await cart.save();
    await cart.populate('items.product', 'title author price image slug quantity');
    
    const responseData = CartDTO.toResponse(cart);
    return sendSuccess(res, responseData, "Item removed from cart");
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return sendNotFound(res, "Cart not found");
    }
    
    cart.items = [];
    cart.total_price = 0;
    cart.total_items = 0;
    
    await cart.save();
    
    const responseData = CartDTO.toResponse(cart);
    return sendSuccess(res, responseData, "Cart cleared");
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart };