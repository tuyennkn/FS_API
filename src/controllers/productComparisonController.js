import Book from '../models/Book.js';
import User from '../models/User.js';
import { compareProducts } from '../services/AI/productComparison.service.js';
import { updateUserPersona, buildInteractionContext } from '../services/AI/personaUpdater.service.js';

/**
 * Compare multiple products with AI assistance
 * POST /api/book/compare
 * Body: { productIds: [], query: '', selectedOptions: [] }
 */
export const compareProductsController = async (req, res) => {
  try {
    const { productIds, query = '', selectedOptions = [] } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 2 sản phẩm để so sánh',
        statusCode: 400
      });
    }

    if (productIds.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể so sánh tối đa 5 sản phẩm cùng lúc',
        statusCode: 400
      });
    }

    // Fetch products from database
    const products = await Book.find({ 
      _id: { $in: productIds },
      isDisable: false 
    }).lean();

    if (products.length !== productIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Một số sản phẩm không tồn tại hoặc đã bị vô hiệu hóa',
        statusCode: 404
      });
    }

    // Get user persona if user is logged in
    let userPersona = '';
    if (userId) {
      try {
        const user = await User.findById(userId).lean();
        if (user?.persona) {
          userPersona = user.persona;
        }
      } catch (error) {
        console.error('Error fetching user persona:', error);
        // Continue without persona
      }
    }

    // Format products for comparison
    const formattedProducts = products.map(p => ({
      id: p._id.toString(),
      title: p.title,
      author: p.author,
      description: p.description,
      genre: p.genre,
      price: p.price,
      rating: p.rating,
      sold: p.sold,
      image: p.image,
      attributes: p.attributes
    }));

    // Call AI comparison service
    const comparisonResult = await compareProducts(
      formattedProducts,
      query,
      userPersona,
      selectedOptions
    );

    if (!comparisonResult.success) {
      return res.status(400).json({
        success: false,
        message: comparisonResult.message,
        statusCode: 400
      });
    }

    // If needs more info, return suggested options
    if (comparisonResult.needsMoreInfo) {
      return res.status(200).json({
        success: true,
        message: comparisonResult.message,
        data: {
          needsMoreInfo: true,
          suggestedOptions: comparisonResult.suggestedOptions
        },
        statusCode: 200
      });
    }

    // Return comparison result
    const response = {
      success: true,
      message: 'So sánh sản phẩm thành công',
      data: {
        needsMoreInfo: false,
        ...comparisonResult.data
      },
      statusCode: 200
    };

    // Update user persona in background (only for actual comparison, not for options)
    if (userId && !comparisonResult.needsMoreInfo) {
      const user = await User.findById(userId).lean();
      const interactionContext = buildInteractionContext('compare', {
        books: formattedProducts,
        query: query
      });
      
      // Run persona update in background without awaiting
      updateUserPersona(userId, user?.persona, interactionContext, 'compare')
        .catch(err => console.error('Persona update failed:', err));
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Compare products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi so sánh sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: 500
    });
  }
};
