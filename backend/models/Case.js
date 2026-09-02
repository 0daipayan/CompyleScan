// // import mongoose from 'mongoose';

// // const caseSchema = new mongoose.Schema({
// //   caseId: { type: String, required: true, unique: true }, // e.g., "LM-A17F"
// //   productName: { type: String, required: true },
// //   category: { 
// //     type: String, 
// //     required: true,
// //     enum: [
// //       'Packaged Food', 
// //       'Cosmetics & Personal Care', 
// //       'Electronics & Appliances', 
// //       'Pharmaceuticals & Medical', 
// //       'Household Chemicals', 
// //       'Textiles & Apparel', 
// //       'E-commerce Commodities', 
// //       'General Goods'
// //     ] 
// //   },
// //   company: { type: String, required: true },
// //   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Changed required: true to default: null
// //   images: [{ type: String }], // Base64 strings or S3/Cloud Storage URLs

// //   // AI-Extracted Declaration Fields
// //   extractedFields: {
// //     mrp: { value: Number, unit: { type: String, default: 'INR' }, confidence: Number },
// //     netQuantity: { value: Number, unit: String, confidence: Number },
// //     manufacturer: { value: String, confidence: Number },
// //     countryOfOrigin: { value: String, confidence: Number },
// //     mfgDate: { value: String, confidence: Number },
// //     consumerCare: { value: String, confidence: Number }
// //   },

// //   // Rule Engine Analysis
// //   ruleResults: [{
// //     ruleId: String, // e.g., "mrp_present", "unit_standardization"
// //     ruleName: String,
// //     status: { type: String, enum: ['PASS', 'FAIL', 'REVIEW'] },
// //     message: String
// //   }],

// //   // Calculated Compliance Metrics
// //   overallStatus: { 
// //     type: String, 
// //     enum: ['PASS', 'FAIL', 'REVIEW', 'INCOMPLETE'], 
// //     default: 'INCOMPLETE' 
// //   },
// //   score: { type: Number, min: 0, max: 100, default: 0 },
// //   faults: [{ type: String }], // Array of failed rule IDs for multi-select dashboard filtering
// //   ruleSetVersion: { type: String, default: 'v2026.08-r1' },

// //   // Officer Review & Manual Override Section
// //   reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
// //   reviewAction: { type: String, enum: ['confirmed', 'overridden', null], default: null },
// //   reviewReason: { type: String, default: '' },
  
// //   location: { type: String, default: 'Kolkata, WB' }
// // }, { timestamps: true });

// // // Compound Indexes for fast dashboard pagination and filtering
// // caseSchema.index({ company: 1, category: 1, overallStatus: 1, score: 1, createdAt: -1 });

// // export default mongoose.model('Case', caseSchema);




// import mongoose from 'mongoose';

// // Flexible sub-schema for individual extracted field objects
// const ExtractedFieldSchema = new mongoose.Schema({
//   value: { type: mongoose.Schema.Types.Mixed, default: null },
//   unit: { type: String, default: null },
//   confidence: { type: Number, default: 0 }
// }, { _id: false });

// const caseSchema = new mongoose.Schema({
//   caseId: { type: String, required: true, unique: true }, // e.g., "LM-A17F"
//   productName: { type: String, required: true },
//   category: { 
//     type: String, 
//     required: true,
//     enum: [
//       'Packaged Food', 
//       'Cosmetics & Personal Care', 
//       'Electronics & Appliances', 
//       'Pharmaceuticals & Medical', 
//       'Household Chemicals', 
//       'Textiles & Apparel', 
//       'E-commerce Commodities', 
//       'General Goods'
//     ] 
//   },
//   company: { type: String, required: true },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//   images: [{ type: String }], // Base64 strings or storage URLs

//   // Updated AI-Extracted Declaration Fields (Strictly matching snake_case structure)
//   extractedFields: {
//     product_name: ExtractedFieldSchema,
//     manufacturer: ExtractedFieldSchema,
//     country_of_origin: ExtractedFieldSchema,
//     net_quantity: ExtractedFieldSchema,
//     manufacture_date: ExtractedFieldSchema,
//     best_before: ExtractedFieldSchema,
//     mrp: ExtractedFieldSchema,
//     consumer_care: ExtractedFieldSchema,
//     unit_sale_price: ExtractedFieldSchema
//   },

//   // Rule Engine Analysis
//   ruleResults: [{
//     ruleId: String, // e.g., "mrp_present", "unit_standardization"
//     ruleName: String,
//     status: { type: String, enum: ['PASS', 'FAIL', 'REVIEW'] },
//     message: String
//   }],

//   // Calculated Compliance Metrics
//   overallStatus: { 
//     type: String, 
//     enum: ['PASS', 'FAIL', 'REVIEW', 'INCOMPLETE'], 
//     default: 'INCOMPLETE' 
//   },
//   score: { type: Number, min: 0, max: 100, default: 0 },
//   faults: [{ type: String }], // Array of failed rule IDs for multi-select dashboard filtering
//   ruleSetVersion: { type: String, default: 'v2026.08-r1' },

//   // Officer Review & Manual Override Section
//   reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//   reviewAction: { type: String, enum: ['confirmed', 'overridden', null], default: null },
//   reviewReason: { type: String, default: '' },
  
//   location: { type: String, default: 'Kolkata, WB' }
// }, { timestamps: true });

// // Compound Indexes for fast dashboard pagination and filtering
// caseSchema.index({ company: 1, category: 1, overallStatus: 1, score: 1, createdAt: -1 });

// export default mongoose.model('Case', caseSchema);




import mongoose from 'mongoose';

// Flexible sub-schema for individual extracted field objects
const ExtractedFieldSchema = new mongoose.Schema({
  value: { type: mongoose.Schema.Types.Mixed, default: null },
  unit: { type: String, default: null },
  confidence: { type: Number, default: 0 }
}, { _id: false });

const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true }, // e.g., "LM-A17F"
  productName: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Packaged Food', 
      'Cosmetics & Personal Care', 
      'Electronics & Appliances', 
      'Pharmaceuticals & Medical', 
      'Household Chemicals', 
      'Textiles & Apparel', 
      'E-commerce Commodities', 
      'General Goods'
    ] 
  },
  company: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  images: [{ type: String }], // Base64 strings or storage URLs

  // Updated AI-Extracted Declaration Fields (Strictly matching snake_case structure)
  extractedFields: {
    product_name: { type: ExtractedFieldSchema, default: () => ({}) },
    manufacturer: { type: ExtractedFieldSchema, default: () => ({}) },
    country_of_origin: { type: ExtractedFieldSchema, default: () => ({}) },
    net_quantity: { type: ExtractedFieldSchema, default: () => ({}) },
    manufacture_date: { type: ExtractedFieldSchema, default: () => ({}) },
    best_before: { type: ExtractedFieldSchema, default: () => ({}) },
    mrp: { type: ExtractedFieldSchema, default: () => ({}) },
    consumer_care: { type: ExtractedFieldSchema, default: () => ({}) },
    unit_sale_price: { type: ExtractedFieldSchema, default: () => ({}) }
  },

  // Rule Engine Analysis
  ruleResults: [{
    ruleId: String, // e.g., "mrp_present", "unit_standardization"
    ruleName: String,
    status: { type: String, enum: ['PASS', 'FAIL', 'REVIEW'] },
    message: String
  }],

  // Calculated Compliance Metrics
  overallStatus: { 
    type: String, 
    enum: ['PASS', 'FAIL', 'REVIEW', 'INCOMPLETE'], 
    default: 'INCOMPLETE' 
  },
  score: { type: Number, min: 0, max: 100, default: 0 },
  faults: [{ type: String }], // Array of failed rule IDs for multi-select dashboard filtering
  ruleSetVersion: { type: String, default: 'v2026.08-r1' },

  // Officer Review & Manual Override Section
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewAction: { type: String, enum: ['confirmed', 'overridden', null], default: null },
  reviewReason: { type: String, default: '' },
  
  location: { type: String, default: 'Kolkata, WB' }
}, { timestamps: true });

// Compound Indexes for fast dashboard pagination and filtering
caseSchema.index({ company: 1, category: 1, overallStatus: 1, score: 1, createdAt: -1 });

export default mongoose.model('Case', caseSchema);