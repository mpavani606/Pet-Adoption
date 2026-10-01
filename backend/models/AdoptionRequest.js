import mongoose from 'mongoose';

const adoptionRequestSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  decisionAt: Date,
  decisionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
adoptionRequestSchema.index({ pet: 1, requester: 1, status: 1 });
export default mongoose.model('AdoptionRequest', adoptionRequestSchema);
