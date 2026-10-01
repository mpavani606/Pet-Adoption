import AdoptionRequest from '../models/AdoptionRequest.js';
import Pet from '../models/Pet.js';

export async function createRequest(req, res, next) {
  try {
    const pet = await Pet.findById(req.body.pet);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    if (pet.status !== 'available') return res.status(400).json({ message: 'This pet is no longer available' });
    const duplicate = await AdoptionRequest.findOne({ pet: pet._id, requester: req.user._id, status: 'pending' });
    if (duplicate) return res.status(409).json({ message: 'You already have a pending request for this pet' });
    const request = await AdoptionRequest.create({ pet: pet._id, requester: req.user._id, message: req.body.message });
    pet.status = 'pending'; await pet.save();
    res.status(201).json(await request.populate('pet requester', 'name type breed email'));
  } catch (error) { next(error); }
}
export async function mine(req, res, next) { try { res.json(await AdoptionRequest.find({ requester: req.user._id }).populate('pet', 'name type breed photoUrl status').sort('-createdAt')); } catch (error) { next(error); } }
export async function listRequests(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const filter = req.query.status ? { status: req.query.status } : {};
    if (req.user.role !== 'admin') {
      const shelterPets = await Pet.find({ shelter: req.user._id }).select('_id');
      filter.pet = { $in: shelterPets.map((pet) => pet._id) };
    }
    const [requests, total] = await Promise.all([
      AdoptionRequest.find(filter).populate('pet', 'name type breed').populate('requester', 'name email phone').sort('-createdAt').skip((page - 1) * limit).limit(limit),
      AdoptionRequest.countDocuments(filter)
    ]);
    res.json({ requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}
export async function getRequest(req, res, next) { try { const request = await AdoptionRequest.findById(req.params.id).populate('pet').populate('requester', 'name email phone'); if (!request) return res.status(404).json({ message: 'Request not found' }); const owns = request.requester._id.equals(req.user._id) || req.user.role === 'admin' || request.pet.shelter.equals(req.user._id); if (!owns) return res.status(403).json({ message: 'Not authorized' }); res.json(request); } catch (error) { next(error); } }
export async function updateRequest(req, res, next) {
  try {
    const request = await AdoptionRequest.findById(req.params.id).populate('pet');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    const isOwner = request.requester.equals(req.user._id);
    const isStaff = req.user.role === 'admin' || request.pet.shelter.equals(req.user._id);
    if (!isOwner && !isStaff) return res.status(403).json({ message: 'Not authorized' });
    if (req.body.message && isOwner && request.status === 'pending') request.message = req.body.message;
    if (req.body.status && isStaff) {
      if (!['pending', 'rejected'].includes(req.body.status)) return res.status(400).json({ message: 'Use the approve endpoint to approve a request' });
      request.status = req.body.status;
      request.decisionAt = new Date();
      request.decisionBy = req.user._id;
      if (req.body.status === 'rejected' && request.pet.status === 'pending') {
        const otherPending = await AdoptionRequest.exists({ pet: request.pet._id, status: 'pending', _id: { $ne: request._id } });
        if (!otherPending) { request.pet.status = 'available'; await request.pet.save(); }
      }
    }
    await request.save();
    res.json(request);
  } catch (error) { next(error); }
}
export async function deleteRequest(req, res, next) { try { const request = await AdoptionRequest.findById(req.params.id); if (!request) return res.status(404).json({ message: 'Request not found' }); if (req.user.role !== 'admin' && !request.requester.equals(req.user._id)) return res.status(403).json({ message: 'Only the requester can cancel this request' }); await request.deleteOne(); res.json({ message: 'Request cancelled' }); } catch (error) { next(error); } }
export async function approveRequest(req, res, next) {
  try {
    const request = await AdoptionRequest.findById(req.params.id).populate('pet');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.user.role !== 'admin' && !request.pet.shelter.equals(req.user._id)) return res.status(403).json({ message: 'Only the owning shelter can approve this request' });
    if (request.status !== 'pending' || request.pet.status === 'adopted') return res.status(400).json({ message: 'Only a pending request for an available pet can be approved' });
    request.status = 'approved';
    request.decisionAt = new Date();
    request.decisionBy = req.user._id;
    request.pet.status = 'adopted';
    await Promise.all([
      request.save(),
      request.pet.save(),
      AdoptionRequest.updateMany({ pet: request.pet._id, _id: { $ne: request._id }, status: 'pending' }, { status: 'rejected', decisionAt: new Date(), decisionBy: req.user._id })
    ]);
    res.json(request);
  } catch (error) { next(error); }
}
