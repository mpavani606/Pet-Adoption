import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  breed: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0 },
  gender: { type: String, enum: ['Female', 'Male'], required: true },
  description: { type: String, required: true },
  photoUrl: { type: String, default: '' },
  status: { type: String, enum: ['available', 'pending', 'adopted'], default: 'available' },
  shelter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
export default mongoose.model('Pet', petSchema);
