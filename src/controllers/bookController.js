import Book from "../models/Book.js";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
} from "../utils/responseHelper.js";
import { BookDTO } from "../dto/index.js";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../utils/constants.js";
import { generateEmbedding } from "../services/AI/embedding.service.js";
import { HTTP_STATUS } from "~/utils/httpStatus.js";
import { simplifyQuery } from "~/services/AI/gemini.service.js";

const createBook = async (req, res) => {
  try {
    const book = new Book(req.body);

    // generate embedding for the book title + summary
    const embedding = await generateEmbedding(`${book.title} ${book.summary}`);
    book.summaryvector = embedding;

    await book.save();
    // Populate the category information after saving
    await book.populate("category_id", "name description isDisable");
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

    // If title or summary is being updated, regenerate the embedding
    if (updateData.title || updateData.summary) {
      const bookForEmbedding = await Book.findById(id);
      const newTitle = updateData.title || bookForEmbedding.title;
      const newSummary = updateData.summary || bookForEmbedding.summary;
      const newEmbedding = await generateEmbedding(`${newTitle} ${newSummary}`);
      updateData.summaryvector = newEmbedding;
    }

    const book = await Book.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("category_id", "name description isDisable");
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
    ).populate("category_id", "name description isDisable");
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

const getAllBook = async (req, res) => {
  try {
    const books = await Book.find().populate(
      "category_id",
      "name description isDisable"
    );
    const responseData = BookDTO.toResponseList(books);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_RETRIEVED);
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
      "category_id",
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
    ).populate("category_id", "name description isDisable");
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
    const { query } = req.body;
    if (!query) {
      return sendError(
        res,
        "Search query is required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Simplify Query
    const simplifiedQuery = await simplifyQuery(query);
    console.log("Simplified Query:", simplifiedQuery);

    // 1. Gọi embedding service để sinh vector từ query
    // const queryEmbedding = await generateEmbedding(simplifiedQuery);

    // 2. Tìm sách bằng Atlas Vector Search
    const books = await Book.aggregate([
      {
        $vectorSearch: {
          index: "1024_Dim",
          path: "summaryvector",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 10,
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

    // 3. Chuẩn hóa response
    const responseData = BookDTO.toResponseList(books);
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.BOOK_RETRIEVED);
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
      return sendError(res, 'No books data provided', HTTP_STATUS.BAD_REQUEST);
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

        // Create book object
        const book = new Book({
          title: bookData.title,
          author: bookData.author || '',
          summary: bookData.summary || bookData.description || '',
          publisher: bookData.publisher || '',
          price: parseFloat(bookData.price) || 0,
          genre: bookData.genre || bookData.category || '',
          publishDate: bookData.publishDate ? new Date(bookData.publishDate) : null,
          quantity: parseInt(bookData.quantity) || 1,
          rating: 0,
          sold: 0,
          isDisable: false
        });

        // Generate embedding if title and summary exist
        if (book.title && book.summary) {
          try {
            const embedding = await generateEmbedding(`${book.title} ${book.summary}`);
            book.summaryvector = embedding;
          } catch (embeddingError) {
            console.log(`Warning: Could not generate embedding for book ${book.title}`);
          }
        }

        await book.save();
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
        books: importedBooks
      },
      statusCode: HTTP_STATUS.CREATED
    });

  } catch (error) {
    console.error('Import error:', error);
    return sendError(res, 'Error importing books', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

export const bookController = {
  createBook,
  updateBook,
  toggleDisableBook,
  getAllBook,
  getBookById,
  summaryvectorBook,
  searchBooks,
  importBooksFromCSV,
};
