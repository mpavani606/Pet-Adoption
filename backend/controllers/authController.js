import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

function response(user) { return { user: user.toSafeObject(), token: generateToken(user._id) }; }
export async function register(req, res, next) {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists' });
    const user = await User.create({ name, email, password, role: ['adopter', 'shelter'].includes(role) ? role : 'adopter', phone });
    res.status(201).json(response(user));
  } catch (error) { next(error); }
}
export async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password || ''))) return res.status(401).json({ message: 'Email or password is incorrect' });
    res.json(response(user));
  } catch (error) { next(error); }
}
export function me(req, res) { res.json({ user: req.user.toSafeObject() }); }
