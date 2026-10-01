import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['adopter', 'shelter', 'admin'], default: 'adopter' },
  phone: { type: String, trim: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = function(password) { return bcrypt.compare(password, this.password); };
userSchema.methods.toSafeObject = function() { const user = this.toObject(); delete user.password; return user; };
export default mongoose.model('User', userSchema);
