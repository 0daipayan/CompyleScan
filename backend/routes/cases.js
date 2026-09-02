import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import Case from '../models/Case.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { getMockAiResponse } from '../utils/mockData.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Helper to safely evaluate field presence without truthiness edge-cases (e.g., numeric 0)
const isFieldPresent = (field) => {
  return field && field.value !== null && field.value !== undefined && String(field.value).trim() !== '';
};

// Helper function to evaluate LMPC compliance rules from the direct JSON structure
const evaluateLmpcRules = (aiData) => {
  const rules = [
    {
      ruleId: 'mrp_present',
      ruleName: 'MRP Declaration',
      status: isFieldPresent(aiData.mrp) ? 'PASS' : 'FAIL',
      message: isFieldPresent(aiData.mrp) 
        ? `MRP declared: ${aiData.mrp.unit || '₹'} ${aiData.mrp.value}` 
        : 'Maximum Retail Price (MRP) declaration missing'
    },
    {
      ruleId: 'net_qty_present',
      ruleName: 'Net Quantity Standard',
      status: isFieldPresent(aiData.net_quantity) ? 'PASS' : 'FAIL',
      message: isFieldPresent(aiData.net_quantity) 
        ? `Net Quantity declared: ${aiData.net_quantity.value} ${aiData.net_quantity.unit || ''}`.trim() 
        : 'Net Quantity declaration missing'
    },
    {
      ruleId: 'mfg_date_present',
      ruleName: 'Date of Manufacture / Packing',
      status: isFieldPresent(aiData.manufacture_date) ? 'PASS' : 'FAIL',
      message: isFieldPresent(aiData.manufacture_date) 
        ? `Mfg Date declared: ${aiData.manufacture_date.value}` 
        : 'Date of manufacture or packing missing'
    },
    {
      ruleId: 'consumer_care_present',
      ruleName: 'Consumer Care Contact Details',
      status: isFieldPresent(aiData.consumer_care) ? 'PASS' : 'FAIL',
      message: isFieldPresent(aiData.consumer_care) 
        ? `Consumer Care details found: ${aiData.consumer_care.value}` 
        : 'Consumer care contact details missing'
    },
    {
      ruleId: 'country_of_origin_present',
      ruleName: 'Country of Origin',
      status: isFieldPresent(aiData.country_of_origin) ? 'PASS' : 'FAIL',
      message: isFieldPresent(aiData.country_of_origin) 
        ? `Country of Origin declared: ${aiData.country_of_origin.value}` 
        : 'Country of origin missing'
    }
  ];

  const passedCount = rules.filter(r => r.status === 'PASS').length;
  const score = Math.round((passedCount / rules.length) * 100);
  const overallStatus = score === 100 ? 'PASS' : 'FAIL';
  const faults = rules.filter(r => r.status === 'FAIL').map(r => r.ruleId);

  return { ruleResults: rules, score, overallStatus, faults };
};

// 1. Mobile App Scan Endpoint (Inspector Protected - AI Extracts Metadata & Rules)
router.post('/inspect', protect, async (req, res) => {
  try {
    const { images, location } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' });
    }

    const caseId = `LM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let aiData;
    const useMock = process.env.USE_MOCK === 'true';

    if (useMock) {
      aiData = getMockAiResponse();
    } else {
      try {
        const pythonRes = await axios.post(`${process.env.PYTHON_AI_URL}/extract`, {
          images
        }, { timeout: 20000 });

        aiData = pythonRes.data;
      } catch (err) {
        console.error("Python AI engine offline/error. Falling back to mock data.", err.message);
        aiData = getMockAiResponse();
      }
    }

    const { ruleResults, score, overallStatus, faults } = evaluateLmpcRules(aiData);

    const productName = aiData.product_name?.value || 'Unlabeled Packaged Item';
    const company = aiData.manufacturer?.value || 'Unknown Manufacturer';
    const category = aiData.category || 'General Goods';

    const caseDoc = new Case({
      caseId,
      productName,
      category,
      company,
      createdBy: req.user._id,
      images,
      location: location || 'Unspecified Location',
      extractedFields: {
        product_name: aiData.product_name || {},
        manufacturer: aiData.manufacturer || {},
        country_of_origin: aiData.country_of_origin || {},
        net_quantity: aiData.net_quantity || {},
        manufacture_date: aiData.manufacture_date || {},
        best_before: aiData.best_before || {},
        mrp: aiData.mrp || {},
        consumer_care: aiData.consumer_care || {},
        unit_sale_price: aiData.unit_sale_price || {}
      },
      ruleResults,
      overallStatus,
      score,
      faults
    });

    await caseDoc.save();
    return res.status(201).json(caseDoc);

  } catch (err) {
    console.error('Inspection Route Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// 2. Web Dashboard Fetch & Filter Endpoint (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const { scoreMin, scoreMax, category, company, fault, status, period, limit = 20, page = 1 } = req.query;

    const query = {};

    if (scoreMin !== undefined || scoreMax !== undefined) {
      query.score = {
        $gte: Number(scoreMin ?? 0),
        $lte: Number(scoreMax ?? 100)
      };
    }

    if (category) query.category = category;
    if (company) query.company = company;
    if (fault) query.faults = fault;
    if (status) query.overallStatus = status;

    if (period === 'monthly') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfMonth };
    }

    const cases = await Case.find(query)
      .populate({ path: 'createdBy', select: 'name officerId', strictPopulate: false })
      .sort({ createdAt: -1 })
      .skip((Math.max(1, Number(page)) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Case.countDocuments(query);

    return res.json({ total, page: Number(page), cases });
  } catch (err) {
    console.error('GET /api/cases Error:', err);
    return res.status(500).json({ error: 'Failed to fetch cases', details: err.message });
  }
});

// 3. Fetch Single Case Detail (Protected)
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    let caseDoc;
    if (mongoose.Types.ObjectId.isValid(id)) {
      caseDoc = await Case.findById(id).populate({ path: 'createdBy', select: 'name officerId', strictPopulate: false });
    } else {
      caseDoc = await Case.findOne({ caseId: id }).populate({ path: 'createdBy', select: 'name officerId', strictPopulate: false });
    }

    if (!caseDoc) return res.status(404).json({ error: 'Case not found' });
    return res.json(caseDoc);
  } catch (err) {
    console.error('GET /api/cases/:id Error:', err);
    return res.status(500).json({ error: 'Failed to fetch case detail', details: err.message });
  }
});

// 4. Officer Review & Override Endpoint (Officer/Admin Protected)
router.patch('/:id/review', protect, authorize('officer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewAction, reviewReason } = req.body;

    let caseDoc;
    if (mongoose.Types.ObjectId.isValid(id)) {
      caseDoc = await Case.findById(id);
    } else {
      caseDoc = await Case.findOne({ caseId: id });
    }

    if (!caseDoc) return res.status(404).json({ error: 'Case not found' });

    caseDoc.reviewAction = reviewAction;
    caseDoc.reviewReason = reviewReason;
    caseDoc.reviewedBy = req.user._id;

    if (reviewAction === 'overridden') {
      caseDoc.overallStatus = 'PASS';
      caseDoc.score = 100;
    } else if (reviewAction === 'confirmed') {
      caseDoc.overallStatus = 'FAIL';
    }

    await caseDoc.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: `CASE_REVIEW_${reviewAction.toUpperCase()}`,
      targetType: 'case',
      targetId: caseDoc._id,
      reason: reviewReason
    });

    return res.json(caseDoc);
  } catch (err) {
    console.error('PATCH /api/cases/:id/review Error:', err);
    return res.status(500).json({ error: 'Review action failed', details: err.message });
  }
});

export default router;