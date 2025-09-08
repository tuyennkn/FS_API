import mongoose from 'mongoose'

const alstatisticSchema = new mongoose.Schema({
  analystic: { type: String },
  listbook: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  recommend: { type: String },
  start: { type: Date },
  end: { type: Date }
}, { timestamps: true })

export default mongoose.model('Alstatistic', alstatisticSchema)
