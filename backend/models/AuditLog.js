import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true,
    enum: ['CASE_REVIEW_CONFIRMED', 'CASE_REVIEW_OVERRIDDEN', 'CASE_CREATED'] 
  },
  targetType: { type: String, enum: ['case', 'rule'], default: 'case' },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  reason: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('AuditLog', auditLogSchema);