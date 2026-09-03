import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Case from '../models/Case.js';
import AuditLog from '../models/AuditLog.js';
import auth from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer safe upload staging setup
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

router.post('/evaluate', auth, upload.single('packageImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No package file asset provided.' });
        }

        // 1. Package image stream to proxy downstream to microservice core
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // 2. Network communication boundary to execute processing pipeline
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        const aiResponse = await axios.post(`${aiEngineUrl}/api/v1/analyze-package`, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Clean up locally mirrored temp file block asynchronously
        fs.unlink(req.file.path, (err) => { if (err) console.error("Temp file cleanup skipped:", err); });

        const report = aiResponse.data;

        // Extract deep validation trees matching your Python engine report outputs
        const scoreInfo = report.score_data || report.score || {};
        const resultsArray = report.results || [];
        const violationsArray = report.violations || [];

        // 3. Map your Python report directly into your Case Schema definition
        const newCase = new Case({
            caseId: `LM-${Math.random().toString(36).substr(2, 4).toUpperCase()}`, // Generates dynamic case tracking reference
            productName: req.body.productName || report.ocr_data?.extracted_fields?.product_name?.value || 'Unknown Product', // FIXED: changed ocr_data to report.ocr_data
            category: req.body.category || 'General Goods',
            company: req.body.company || 'Unknown Corporation',
            createdBy: req.user.id,
            images: [req.file.originalname],

            // Strictly maps Python rule formats to your model properties
            extractedFields: report.ocr_data?.extracted_fields || {},
            ruleResults: resultsArray.map(res => ({
                ruleId: res.rule_id || '',
                ruleName: res.rule_name || '',
                status: res.status || 'REVIEW',
                message: res.message || ''
            })),

            // Mapping final metrics down into the Case model tracking criteria
            overallStatus: violationsArray.length > 0 ? 'FAIL' : 'PASS',
            score: scoreInfo.final_score || 0,
            faults: violationsArray.map(v => v.rule_id || v.ruleId || ''),
            ruleSetVersion: report.rule_set_version || 'v2026.08-r1',
            location: req.body.location || 'Kolkata, WB'
        });
        
        await newCase.save();

        // 4. Concurrently commit security history log tracks to AuditLog.js
        const logEntry = new AuditLog({
            action: 'COMPLIANCE_EVALUATION',
            userId: req.user.id,
            caseId: newCase._id,
            timestamp: new Date(),
            details: { violationsCount: violationsArray.length }
        });
        await logEntry.save();

        // 5. Send unified record matrix cleanly back out to frontend state store
        return res.status(201).json({
            success: true,
            caseId: newCase.caseId,
            mongoId: newCase._id,
            overallStatus: newCase.overallStatus,
            score: newCase.score,
            report: report
        });

    } catch (err) {
        // Clean file pointers if down-stream exceptions hit execution mid-flight
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error('System Pipeline Failure:', err.message);
        return res.status(500).json({
            msg: 'Metrology Processing Pipeline Core Failure',
            error: err.response?.data?.detail || err.message
        });
    }
});

export default router;
