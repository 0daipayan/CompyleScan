import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Case from '../models/Case.js';
import AuditLog from '../models/AuditLog.js';
import * as authModule from '../middleware/auth.js';

const auth = authModule.auth || authModule.protect || authModule.verifyToken || authModule.default || ((req, res, next) => next());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// Helper to normalize confidence scores from 0-100 down to 0-1 decimal
const normalizeFields = (fieldsObj = {}) => {
    const normalized = JSON.parse(JSON.stringify(fieldsObj));
    for (const key in normalized) {
        if (normalized[key] && typeof normalized[key].confidence === 'number') {
            if (normalized[key].confidence > 1) {
                normalized[key].confidence = Number((normalized[key].confidence / 100).toFixed(2));
            }
        }
    }
    return normalized;
};

router.post('/evaluate', auth, upload.array('packageImages', 4), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'No package images provided.' });
        }

        // Store original file names BEFORE unlinking temporary upload files
        const originalFileNames = req.files.map((file) => file.originalname);

        // 1. Convert uploaded files to Base64 data strings safely
        const base64Images = req.files.map((file) => {
            const fileBuffer = fs.readFileSync(file.path);
            return `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
        });

        // Safe synchronous cleanup AFTER files are fully read into buffer
        req.files.forEach((file) => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });

        // 2. Call FastAPI Python Engine
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000';

        const aiResponse = await axios.post(`${aiEngineUrl}/extract`, {
            images: base64Images
        }, {
            headers: { 'Content-Type': 'application/json' },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const report = aiResponse.data;

        // Extract deep validation trees matching Python output
        const scoreInfo = report.score_data || report.score || {};
        const resultsArray = report.rule_results || report.results || [];
        const violationsArray = report.violations || [];

        // 3. Map to Case Schema
        const newCase = new Case({
            caseId: `LM-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            productName: req.body.productName || report.ocr_data?.extracted_fields?.product_name?.value || 'Unknown Product',
            category: req.body.category || 'General Goods',
            company: req.body.company || 'Unknown Corporation',
            createdBy: req.user ? req.user.id : null,
            images: originalFileNames,
            extractedFields: normalizeFields(report.ocr_data?.extracted_fields),
            ruleResults: resultsArray.map(res => ({
                ruleId: res.rule_id || '',
                ruleName: res.rule_name || '',
                status: res.status || 'REVIEW',
                message: res.message || ''
            })),
            overallStatus: report.summary?.overall_status || (violationsArray.length > 0 ? 'FAIL' : 'PASS'),
            score: report.summary?.score ?? scoreInfo.final_score ?? 0,
            faults: violationsArray.map(v => v.rule_id || v.ruleId || ''),
            ruleSetVersion: report.rule_set_version || 'v2026.08-r1',
            location: req.body.location || 'Kolkata, WB'
        });

        await newCase.save();

        // 4. Audit Log Entry
        const logEntry = new AuditLog({
            actorId: req.user ? req.user.id : null,
            action: 'CASE_CREATED',
            targetType: 'case',
            targetId: newCase._id,
            timestamp: new Date(),
            reason: `Compliance evaluation completed. Violations: ${violationsArray.length}`
        });
        await logEntry.save();

        // 5. Return Python Report Directly
        return res.status(201).json({
            ...report,
            case_id: newCase.caseId,
            case_db_id: newCase._id,
            images: newCase.images,
            saved_case: true,
        });

    } catch (err) {
        // Cleanup leftover files on error
        if (req.files) {
            req.files.forEach((file) => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        console.error('System Pipeline Failure:', err.response?.data || err.message);
        return res.status(500).json({
            msg: 'Metrology Processing Pipeline Core Failure',
            error: err.response?.data?.detail || err.message
        });
    }
});

export default router;