import { moderateText, moderateImage } from '~/services/AI/gemini.service.js'
import fs from 'fs'

export async function checkComment(req, res, next) {
  try {
    const { content } = req.body
    if (!content) next()

    const isSafe = await moderateText(content)
    if (!isSafe) {
      return res.status(400).json({ message: 'Nội dung comment phản cảm, không được phép!' })
    }

    next()
  } catch (err) {
    console.error('Moderation error:', err)
    res.status(500).json({ message: 'Lỗi kiểm tra nội dung' })
  }
}
export async function checkAvatar(req, res, next) {
  try {
    let base64Image = null

    if (req.file) {
      // Trường hợp upload file
      base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' })
    } else if (req.body.avatar) {
      // Trường hợp gửi link ảnh
      const response = await fetch(req.body.avatar)
      if (!response.ok) {
        return res.status(400).json({ message: 'Không tải được ảnh từ URL' })
      }
      const buffer = await response.arrayBuffer()
      base64Image = Buffer.from(buffer).toString('base64')
    } else {
      return res.status(400).json({ message: 'Thiếu ảnh đại diện' })
    }

    const isSafe = await moderateImage(base64Image)
    if (!isSafe) {
      return res.status(400).json({ message: 'Ảnh đại diện phản cảm, vui lòng chọn ảnh khác!' })
    }

    next()
  } catch (err) {
    console.error('Moderation error:', err)
    res.status(500).json({ message: 'Lỗi kiểm tra ảnh' })
  }
}

