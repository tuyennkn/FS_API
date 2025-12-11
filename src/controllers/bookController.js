import Book from "../models/Book.js";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginated,
} from "../utils/responseHelper.js";
import { BookDTO } from "../dto/index.js";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../utils/constants.js";
import { generateEmbedding } from "../services/AI/embedding.service.js";
import { HTTP_STATUS } from "~/utils/httpStatus.js";
import { simplifyQuery, evaluateBookForUser } from "~/services/AI/gemini.service.js";
import { updateUserPersona, buildInteractionContext } from "../services/AI/personaUpdater.service.js";
import { processSearchConversation, createConversationTurn } from "../services/AI/conversationalSearch.service.js";
import { StatusCodes } from "http-status-codes";
import { embeddingTextGenerator } from "~/utils/algorithms.js";
import { handleCategoryForBook } from "../services/categoryAnalysis.service.js";

const createBook = async (req, res) => {
  try {
    // Generate slug if not provided
    if (!req.body.slug && req.body.title) {
      req.body.slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();
    }

    // Ensure ISBN is stored as string
    if (req.body.attributes?.isbn) {
      req.body.attributes.isbn = String(req.body.attributes.isbn).trim();
    }

    const book = new Book(req.body);

    // generate embedding for the book title + description
    const embedding = await generateEmbedding(embeddingTextGenerator(book));
    book.embedding = embedding; // Changed from summaryvector

    await book.save();

    // Populate the category information after saving
    await book.populate("category", "name description isDisable");
    const responseData = BookDTO.toResponse(book);
    return sendCreated(res, responseData, SUCCESS_MESSAGES.BOOK_CREATED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    // Generate slug if title is being updated and slug is not provided
    if (updateData.title && !updateData.slug) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();
    }

    // Ensure ISBN is stored as string
    if (updateData.attributes?.isbn) {
      updateData.attributes.isbn = String(updateData.attributes.isbn).trim();
    }

    // If title or description is being updated, regenerate the embedding
    if (updateData.title || updateData.description) {
      const bookForEmbedding = await Book.findById(id);
      const newTitle = updateData.title || bookForEmbedding.title;
      const newDescription = updateData.description || bookForEmbedding.description;
      const newEmbedding = await generateEmbedding(embeddingTextGenerator({
        ...bookForEmbedding,
        title: newTitle,
        description: newDescription
      }));
      updateData.embedding = newEmbedding; // Changed from summaryvector
    }

    const book = await Book.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("category", "name description isDisable");
    if (!book) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }
    const responseData = BookDTO.toResponse(book);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_UPDATED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const toggleDisableBook = async (req, res) => {
  try {
    const { id, isDisable } = req.body;

    if (!id) {
      return sendError(res, "Book ID is required", 400);
    }

    const book = await Book.findByIdAndUpdate(
      id,
      { isDisable },
      { new: true }
    ).populate("category", "name description isDisable");
    if (!book) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }
    const responseData = BookDTO.toResponse(book);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_UPDATED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Get featured books with no pagination
const getFeaturedBooks = async (req, res) => {
  try {
    const books = await Book.find({ isDisable: false })
      .sort({ rating: -1 }) // Sort by rating descending
      .limit(8) // Limit to top 8 books
      .populate("category", "name description isDisable");
    const responseData = BookDTO.toResponseList(books);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_RETRIEVED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
}

const getAllBook = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query - không bắt buộc phải có search query
    let query = { isDisable: false };
    
    // Text search - chỉ thêm nếu có search query
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build sort
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'asc' ? 1 : -1;
      sort[sortBy] = order;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get books
    const books = await Book.find(query)
      .populate("category", "name description isDisable")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const responseData = BookDTO.toResponseList(books);
    
    return sendPaginated(
      res,
      responseData,
      pageNum,
      limitNum,
      totalCount,
      SUCCESS_MESSAGES.BOOK_RETRIEVED,
      StatusCodes.OK
    );
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const getPaginatedBooks = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const totalCount = await Book.countDocuments({});
    const totalPage = Math.ceil(totalCount / limit);

    const books = await Book.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name description isDisable");
    const responseData = BookDTO.toResponseList(books);
    return sendPaginated(
      res,
      responseData,
      page,
      limit,
      totalCount,
      SUCCESS_MESSAGES.BOOK_RETRIEVED,
      StatusCodes.OK
    );
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id).populate(
      "category",
      "name description isDisable"
    );
    if (!book) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }
    const responseData = BookDTO.toResponse(book);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_RETRIEVED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const getBookBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const book = await Book.findOne({ slug }).populate(
      "category",
      "name description isDisable"
    );
    if (!book) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }
    const responseData = BookDTO.toResponse(book);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_RETRIEVED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const summaryvectorBook = async (req, res) => {
  try {
    const { id, summaryvector } = req.body;
    const book = await Book.findByIdAndUpdate(
      id,
      { summaryvector },
      { new: true }
    ).populate("category", "name description isDisable");
    if (!book) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }
    const responseData = BookDTO.toResponse(book);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_UPDATED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const searchBooks = async (req, res) => {
  try {
    const { query, conversationHistory = [] } = req.body;
    if (!query) {
      return sendError(
        res,
        "Search query is required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Get user persona if authenticated
    const userId = req.user?.id;
    let userPersona = '';
    if (userId) {
      const user = req.user;
      userPersona = user.persona || '';
    }

    // Process conversational search with persona
    const conversation = await processSearchConversation(query, conversationHistory, userPersona);

    // If AI needs clarification, return question
    if (conversation.needsClarification && conversation.question) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        needsClarification: true,
        question: conversation.question,
        reason: conversation.reason,
        conversationSummary: conversation.conversationSummary,
        message: 'Cần thêm thông tin để tìm kiếm chính xác',
        statusCode: HTTP_STATUS.OK
      });
    }

    // AI confirmed we can search - use simplified query
    const searchQuery = conversation.simplifiedQuery || query;

    // Double-check with simplifyQuery (for meaningless check)
    const simplifiedQuery = await simplifyQuery(searchQuery);

    if(simplifiedQuery.isMeaningless) {
      return sendSuccess(res, [], SUCCESS_MESSAGES.BOOK_RETRIEVED);
    }

    // 1. Generate embedding from final query
    const queryEmbedding = await generateEmbedding(simplifiedQuery.simplifiedQuery);

    // 2. Vector search
    const books = await Book.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 10,
          limit: 8,
        },
      },
      {
        $addFields: {
          score: { $meta: "vectorSearchScore" },
        },
      },
      {
        $match: {
          score: { $gte: 0.75 }, // threshold
        },
      },
    ]);

    // 3. Update user persona in background (non-blocking)
    if (userId) {
      const user = req.user;
      const interactionContext = buildInteractionContext('search', {
        query: simplifiedQuery.simplifiedQuery,
        results: books.length,
        conversationTurns: conversationHistory.length
      });
      
      // Run persona update in background without awaiting
      updateUserPersona(userId, user.persona, interactionContext, 'search')
        .catch(err => console.error('Persona update failed:', err));
    }

    // 4. Return search results
    const responseData = BookDTO.toResponseList(books);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      needsClarification: false,
      data: responseData,
      searchQuery: simplifiedQuery.simplifiedQuery,
      conversationSummary: conversation.conversationSummary,
      message: SUCCESS_MESSAGES.BOOK_RETRIEVED,
      statusCode: HTTP_STATUS.OK
    });

  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const searchKeywordAndFilters = async (req, res) => {
  try {
    const { 
      search,
      category, 
      minPrice, 
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.body;

    // Build query - không bắt buộc phải có search query
    let query = { isDisable: false };
    
    // Text search - chỉ thêm nếu có search query
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Price filter  
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Build sort
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'asc' ? 1 : -1;
      sort[sortBy] = order;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get books
    const books = await Book.find(query)
      .populate("category", "name description isDisable")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const responseData = BookDTO.toResponseList(books);
    
    return sendPaginated(
      res,
      responseData,
      pageNum,
      limitNum,
      totalCount,
      SUCCESS_MESSAGES.BOOK_RETRIEVED,
      StatusCodes.OK
    );
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

// Import books from CSV
const importBooksFromCSV = async (req, res) => {
  try {
    // Parse CSV data from request body
    const { books } = req.body;

    if (!books || !Array.isArray(books) || books.length === 0) {
      return sendError(res, "No books data provided", HTTP_STATUS.BAD_REQUEST);
    }

    const importedBooks = [];
    const errors = [];

    for (let i = 0; i < books.length; i++) {
      try {
        const bookData = books[i];

        // Validate required fields
        if (!bookData.title || !bookData.price) {
          errors.push(`Row ${i + 1}: Title and price are required`);
          continue;
        }

        // Generate slug from title
        const slug = bookData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Create book object with new schema
        const book = new Book({
          title: bookData.title,
          author: bookData.author || "",
          description: bookData.description || bookData.summary || "",
          slug: slug + '-' + Date.now(), // Ensure uniqueness
          price: parseFloat(bookData.price) || 0,
          rating: 0,
          genre: bookData.genre || bookData.category || "",
          quantity: parseInt(bookData.quantity) || 1,
          sold: 0,
          image: bookData.image ? (Array.isArray(bookData.image) ? bookData.image : [bookData.image]) :
            bookData.imageUrl ? [bookData.imageUrl] : [],
          isDisable: false,

          // Map to attributes object
          attributes: {
            isbn: bookData.isbn ? String(bookData.isbn).trim() : null, // Ensure ISBN is string
            publisher: bookData.publisher || "",
            firstPublishDate: bookData.firstPublishDate ? new Date(bookData.firstPublishDate) : null,
            publishDate: bookData.publishDate ? new Date(bookData.publishDate) : null,
            pages: bookData.pages ? parseInt(bookData.pages) : null,
            language: bookData.language || null,
            edition: bookData.edition || null,
            bookFormat: bookData.bookFormat || null,
            characters: bookData.characters || null,
            awards: bookData.awards || null
          }
        });

        // Generate embedding if title and description exist
        if (book.title && book.description) {
          try {
            const embedding = await generateEmbedding(
              embeddingTextGenerator(book)
            );
            book.embedding = embedding; // Changed from summaryvector
          } catch (embeddingError) {
            console.log(
              `Warning: Could not generate embedding for book ${book.title}`
            );
          }
        }

        await book.save();

        // Handle category assignment or create pending category for CSV imports
        if (bookData.genre && !bookData.category) {
          try {
            const matchedCategory = await handleCategoryForBook({
              genre: bookData.genre,
              _id: book._id,
              title: book.title,
              author: book.author,
              image: book.image
            });

            if (matchedCategory) {
              // Update book with found category
              book.category = matchedCategory._id;
              await book.save();
              console.log(`Auto-assigned category: ${matchedCategory.name} to book: ${book.title} (CSV import)`);
            } else {
              console.log(`Created pending category for book: ${book.title} with genre: ${bookData.genre} (CSV import)`);
            }
          } catch (categoryError) {
            console.error('Error handling category for book during CSV import:', categoryError);
            // Don't fail book creation if category handling fails
          }
        }

        importedBooks.push(book);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: `Successfully imported ${importedBooks.length} books`,
      data: {
        imported: importedBooks.length,
        total: books.length,
        errors: errors,
        books: importedBooks,
      },
      statusCode: HTTP_STATUS.CREATED,
    });
  } catch (error) {
    console.error("Import error:", error);
    return sendError(
      res,
      "Error importing books",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

const getRecommendedBooks = async (req, res) => {
  try {
    const { limit = 9 } = req.query;
    const userId = req.user?.id;
    const limitNum = parseInt(limit);

    // If user is logged in and has persona, use persona-based recommendations
    if (userId && req.user?.persona) {
      try {
        // Generate embedding from user persona
        const personaEmbedding = await generateEmbedding(req.user.persona);

        // Vector search based on persona
        const books = await Book.aggregate([
          {
            $vectorSearch: {
              index: "default",
              path: "embedding",
              queryVector: personaEmbedding,
              numCandidates: limitNum * 3,
              limit: limitNum,
            },
          },
          {
            $addFields: {
              score: { $meta: "vectorSearchScore" },
            },
          },
          {
            $match: {
              isDisable: false,
              score: { $gte: 0.7 }, // threshold for persona match
            },
          },
        ]);

        if (books.length > 0) {
          const responseData = BookDTO.toResponseList(books);
          return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_RETRIEVED);
        }
      } catch (error) {
        console.error('Error with persona-based recommendations:', error);
        // Fall through to newest books
      }
    }

    // Fallback: return newest books for guests or if persona search fails
    const books = await Book.find({ isDisable: false })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .populate("category", "name description isDisable");

    const responseData = BookDTO.toResponseList(books);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_RETRIEVED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const getRelatedBooks = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    const limitNum = parseInt(limit);

    // Get the current book
    const currentBook = await Book.findById(id);
    if (!currentBook) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    // Generate embedding from title + genre
    const relatedText = `${currentBook.title} ${currentBook.genre || ''}`;
    const relatedEmbedding = await generateEmbedding(relatedText);

    // Vector search for similar books (exclude current book)
    const books = await Book.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embedding",
          queryVector: relatedEmbedding,
          numCandidates: limitNum * 3,
          limit: limitNum + 1, // +1 because we'll filter out current book
        },
      },
      {
        $addFields: {
          score: { $meta: "vectorSearchScore" },
        },
      },
      {
        $match: {
          isDisable: false,
          _id: { $ne: currentBook._id }, // exclude current book
          score: { $gte: 0.75 }, // threshold for similarity
        },
      },
      {
        $limit: limitNum,
      },
    ]);

    const responseData = BookDTO.toResponseList(books);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_RETRIEVED);
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

const getBookPersonaNote = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get book by slug
    const book = await Book.findOne({ slug });
    if (!book) {
      return sendNotFound(res, ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    // Get user persona - optional (guest users won't have it)
    const userId = req.user?.id;
    let userPersona = '';
    
    if (userId && req.user?.persona) {
      userPersona = req.user.persona;
    }

    // Prepare book data for evaluation
    const bookData = {
      title: book.title,
      description: book.description || '',
      price: book.price,
      genre: book.genre || ''
    };

    // Evaluate book with AI
    const evaluation = await evaluateBookForUser(bookData, userPersona);

    return sendSuccess(res, evaluation, 'Đánh giá sách thành công');
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, {
      message: error.message,
    });
  }
};

export const bookController = {
  createBook,
  updateBook,
  toggleDisableBook,
  getAllBook,
  getFeaturedBooks,
  getPaginatedBooks,
  getBookById,
  getBookBySlug,
  summaryvectorBook,
  searchBooks,
  searchKeywordAndFilters,
  importBooksFromCSV,
  getRecommendedBooks,
  getRelatedBooks,
  getBookPersonaNote,
};
