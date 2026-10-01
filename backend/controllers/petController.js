import Pet from '../models/Pet.js';

const pagination = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });
export async function listPets(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1), limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const filter = req.query.status ? { status: req.query.status } : {};
    const [pets, total] = await Promise.all([Pet.find(filter).populate('shelter', 'name').sort('-createdAt').skip((page - 1) * limit).limit(limit), Pet.countDocuments(filter)]);
    res.json({ pets, pagination: pagination(page, limit, total) });
  } catch (error) { next(error); }
}
export async function availablePets(req, res, next) { req.query.status = 'available'; return listPets(req, res, next); }
export async function searchPets(req, res, next) {
  try {
    const filter = { status: 'available' };
    if (req.query.type) filter.type = new RegExp(req.query.type, 'i');
    if (req.query.age) filter.age = Number(req.query.age);
    if (req.query.breed) filter.breed = new RegExp(req.query.breed, 'i');
    const pets = await Pet.find(filter).populate('shelter', 'name').sort('-createdAt');
    res.json({ pets, pagination: { page: 1, limit: pets.length, total: pets.length, totalPages: 1 } });
  } catch (error) { next(error); }
}
export async function getPet(req, res, next) { try { const pet = await Pet.findById(req.params.id).populate('shelter', 'name email'); if (!pet) return res.status(404).json({ message: 'Pet not found' }); res.json(pet); } catch (error) { next(error); } }
export async function createPet(req, res, next) { try { const pet = await Pet.create({ ...req.body, shelter: req.user._id }); res.status(201).json(pet); } catch (error) { next(error); } }
export async function updatePet(req, res, next) { try { const pet = await Pet.findById(req.params.id); if (!pet) return res.status(404).json({ message: 'Pet not found' }); if (req.user.role !== 'admin' && !pet.shelter.equals(req.user._id)) return res.status(403).json({ message: 'Only the owning shelter can update this pet' }); Object.assign(pet, req.body); await pet.save(); res.json(pet); } catch (error) { next(error); } }
export async function deletePet(req, res, next) { try { const pet = await Pet.findById(req.params.id); if (!pet) return res.status(404).json({ message: 'Pet not found' }); if (req.user.role !== 'admin' && !pet.shelter.equals(req.user._id)) return res.status(403).json({ message: 'Only the owning shelter can delete this pet' }); await pet.deleteOne(); res.json({ message: 'Pet listing deleted' }); } catch (error) { next(error); } }
