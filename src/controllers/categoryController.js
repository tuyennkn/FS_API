import Category from '~/models/Category'

const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body
        const exists = await Category.findOne({ name })
        if (exists) {
            return res.status(400).json({ message: 'Category name already exists' })
        }
        const category = new Category({ name, description })
        await category.save()

        res.status(201).json({ message: 'Category created successfully', category })
    } catch (err) {
        next(err)
    }

}

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.body
        const { name, description, isDisable } = req.body
        
        const category = await Category.findByIdAndUpdate(
            id,
            { name, description, isDisable },
            { new: true, runValidators: true }
        )
        if (!category) {
            return res.status(404).json({ message: 'Category not found' })
        }
        res.json({ message: 'Category updated successfully', category })
    } catch (err) {
        next(err)
    }
}

const listCategories = async (req, res, next) => {
    try {
        const categories = await Category.find()
        res.json({ categories })
    } catch (err) {
        next(err)
    }
}

const getCategory = async (req, res, next) => {
    try {
        const { id } = req.body
        const category = await Category.findById(id)        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' })
        }
        res.json({ category })
    } catch (err) {
        next(err)
    }
}

const toggleDisbaleCategory = async (req, res) => {
     try {
    const { id, isDisable } = req.body
    const category = await Category.findByIdAndUpdate(id, { isDisable }, { new: true })
    if (!category) return res.status(404).json({ message: 'Không tìm thấy The loai do' })
    res.json({ message: 'Cập nhật trạng thái isDisable thành công', data: category })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật isDisable', error: error.message })
  }
}

export const categoryController = {
    createCategory,
    updateCategory,
    listCategories,
    getCategory,
    toggleDisbaleCategory
}