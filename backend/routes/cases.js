const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');

// Multer safe upload staging setup
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

router.post('/evaluate', auth, upload.single('packageImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No package engineering file assets provided.' });
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

        // 3. Derive runtime attributes map layout back into Mongoose Database layers
        const scoreInfo = report.score_data || report.score || {};

        const newCase = new Case({
            userId: req.user.id,
            status: report.violations && report.violations.length > 0 ? 'Violation Detected' : 'Compliant',
            complianceScore: scoreInfo.final_score || 100,
            reportDetails: report, // Capture complete dynamic JSON object tree
            createdAt: new Date()
        });
        await newCase.save();

        // 4. Concurrently commit security history log tracks to AuditLog.js
        const logEntry = new AuditLog({
            action: 'COMPLIANCE_EVALUATION',
            userId: req.user.id,
            caseId: newCase._id,
            timestamp: new Date(),
            details: { violationsCount: report.violations ? report.violations.length : 0 }
        });
        await logEntry.save();

        // 5. Send unified record matrix cleanly back out to frontend state store
        return res.status(201).json({
            success: true,
            caseId: newCase._id,
            status: newCase.status,
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

module.exports = router;
