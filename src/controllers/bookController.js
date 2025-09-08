import Book from '../models/Book.js'

const createBook = async (req, res) => {
    try {
        const book = new Book(req.body)
        await book.save()
        res.status(201).json({message : 'Them sach thanh cong', data:book})
    } catch (error) {
        res.status(500).json({message: 'Them sach that bai', error: error.message})
    }
}

const updateBook = async (req, res) => {
    try {
        const {id, ...updateData} = req.body
        const book = await Book.findByIdAndUpdate(id, updateData, {new: true})
        if (!book) {
            return res.status(404).json({message: 'Khong tim thay sach'})
        }
        res.status(200).json({message: 'Cap nhat sach thanh cong', data: book})
    } catch (error) {
        res.status(500).json({message: 'Cap nhat sach that bai', error: error.message})
    }
}

const toggleDisbaleBook = async (req, res) => {
     try {
    const { id, isDisable } = req.body
    const book = await Book.findByIdAndUpdate(id, { isDisable }, { new: true })
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' })
    res.json({ message: 'Cập nhật trạng thái isDisable thành công', data: book })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật isDisable', error: error.message })
  }
}

const getAllBook = async (req, res) => {
    try {
        const books = await Book.find()
        res.status(200).json({message: 'Lay danh sach sach thanh cong', data: books})
    }
    catch (error) {
        res.status(500).json({message: 'Lay danh sach sach that bai', error: error.message})
    }
}

const getBookById = async (req, res) => {
    try {
        const {id} = req.params
        const book = await Book.findById(id)
        if (!book) {
            return res.status(404).json({message: 'Khong tim thay sach'})
        }
        res.status(200).json({message: 'Lay thong tin sach thanh cong', data: book})
    } catch (error) {
        res.status(500).json({message: 'Lay thong tin sach that bai', error: error.message})
    }
}

const summaryvectorBook = async (req, res) => {
     try {
    const { id, summaryvector } = req.body
    const book = await Book.findByIdAndUpdate(id, { summaryvector }, { new: true })
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' })
    res.json({ message: 'Cập nhật vetor thành công', data: book })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật vetor', error: error.message })
  }
}

export const bookController = {
    createBook,
    updateBook,
    toggleDisbaleBook,
    getAllBook,
    getBookById,
    summaryvectorBook
}