import mongoose from 'mongoose';

// --------------------------------------------------
// Flexible schema for individual extracted fields
// --------------------------------------------------

const ExtractedFieldSchema = new mongoose.Schema(
  {
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    unit: {
      type: String,
      default: null
    },

    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100 // UPDATED: Changed from 1 to 100 to prevent validation failures
    }
  },
  {
    _id: false
  }
);


// --------------------------------------------------
// Case Schema
// --------------------------------------------------

const caseSchema = new mongoose.Schema(
  {

    // --------------------------------------------------
    // Basic Case Information
    // --------------------------------------------------

    caseId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    productName: {
      type: String,
      required: true,
      trim: true
    },

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

    company: {
      type: String,
      required: true,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },


    // --------------------------------------------------
    // Product Images
    // --------------------------------------------------

    images: [
      {
        type: String
      }
    ],


    // --------------------------------------------------
    // AI Extracted Declaration Fields
    // --------------------------------------------------

    extractedFields: {

      product_name: {
        type: ExtractedFieldSchema,
        default: () => ({})
      },

      manufacturer: {
        type: ExtractedFieldSchema,
        default: () => ({})
      },

      country_of_origin: {
        type: ExtractedFieldSchema,
        default: () => ({})
      },

      net_quantity: {
        type: ExtractedFieldSchema,
        default: () => ({})
      },

      manufacture_date: {
        type: ExtractedFieldSchema,
        default: () => ({})
      },

      best_before: {
        type: ExtractedFieldSchema,
        default: () => ({})
      },

      mrp: {
        type: ExtractedFieldSchema,
        default: () => ({})
      },

      consumer_care: {
        type: ExtractedFieldSchema,
        default: () => ({})
      },

      unit_sale_price: {
        type: ExtractedFieldSchema,
        default: () => ({})
      }

    },


    // --------------------------------------------------
    // Rule Engine Results
    // --------------------------------------------------

    ruleResults: [

      {

        ruleId: {
          type: String,
          required: true
        },

        ruleName: {
          type: String,
          default: ''
        },

        field: {
          type: String,
          default: ''
        },

        status: {
          type: String,

          enum: [
            'PASS',
            'FAIL',
            'REVIEW',
            'NOT_APPLICABLE'
          ],

          required: true
        },

        value: {
          type: mongoose.Schema.Types.Mixed,
          default: null
        },

        message: {
          type: String,
          default: ''
        }

      }

    ],


    // --------------------------------------------------
    // Compliance Summary
    // --------------------------------------------------

    overallStatus: {

      type: String,

      enum: [
        'PASS',
        'FAIL',
        'REVIEW',
        'INCOMPLETE'
      ],

      default: 'INCOMPLETE'

    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },


    // --------------------------------------------------
    // Failed Rule IDs
    // --------------------------------------------------

    faults: [
      {
        type: String
      }
    ],


    // --------------------------------------------------
    // Rule Set Version
    // --------------------------------------------------

    ruleSetVersion: {
      type: String,
      default: 'v2026.08-r1'
    },


    // --------------------------------------------------
    // Officer Review / Manual Override
    // --------------------------------------------------

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    reviewAction: {
      type: String,

      enum: [
        'confirmed',
        'overridden',
        null
      ],

      default: null
    },

    reviewReason: {
      type: String,
      default: ''
    },


    // --------------------------------------------------
    // Location
    // --------------------------------------------------

    location: {
      type: String,
      default: 'Kolkata, WB'
    }

  },

  {
    timestamps: true
  }

);


// --------------------------------------------------
// Indexes
// --------------------------------------------------

caseSchema.index({
  company: 1,
  category: 1,
  overallStatus: 1,
  score: 1,
  createdAt: -1
});


// --------------------------------------------------
// Export Model
// --------------------------------------------------

export default mongoose.model('Case', caseSchema);