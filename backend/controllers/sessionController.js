const Session = require('../models/Session');
const User = require('../models/User');

// @desc    Create new session
// @route   POST /api/sessions/create
exports.createSession = async (req, res) => {
    try {
        const { className } = req.body;
        const session = await Session.create({
            lecturerId: req.user.id,
            className,
            isActive: true,
            startTime: new Date()
        });
        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    End session
// @route   PUT /api/sessions/:id/end
exports.endSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        session.isActive = false;
        session.endTime = new Date();
        await session.save();
        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add disturbance data
// @route   POST /api/sessions/:id/disturbance
exports.addDisturbance = async (req, res) => {
    try {
        const { studentId, talkingDuration, interruptions, volumeLevel } = req.body;
        const session = await Session.findById(req.params.id);
        
        if (!session || !session.isActive) {
            return res.status(404).json({ success: false, message: 'Active session not found' });
        }
        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        await session.addDisturbance(
            studentId,
            student.name,
            student.rollNumber,
            talkingDuration,
            interruptions,
            volumeLevel
        );
        
        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get session report
// @route   GET /api/sessions/:id/report
exports.getReport = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id).populate('disturbances.studentId');
        
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        
        const disturbances = session.disturbances;
        
        // Sort by disturbance score
        const sortedByDisturbance = [...disturbances].sort((a, b) => b.disturbanceScore - a.disturbanceScore);
        
        const mostDisturbing = sortedByDisturbance[0] || null;
        const leastDisturbing = sortedByDisturbance[sortedByDisturbance.length - 1] || null;
        const silentStudents = disturbances.filter(d => d.talkingDuration < 10);
        const totalInterruptions = disturbances.reduce((sum, d) => sum + d.interruptions, 0);
        
        const report = {
            mostDisturbingStudent: mostDisturbing ? {
                name: mostDisturbing.studentName,
                rollNumber: mostDisturbing.rollNumber,
                score: mostDisturbing.disturbanceScore
            } : null,
            leastDisturbingStudent: leastDisturbing ? {
                name: leastDisturbing.studentName,
                rollNumber: leastDisturbing.rollNumber,
                score: leastDisturbing.disturbanceScore
            } : null,
            silentStudents: silentStudents.map(s => ({
                name: s.studentName,
                rollNumber: s.rollNumber
            })),
            totalInterruptions,
            averageDisturbanceScore: disturbances.length > 0 
                ? disturbances.reduce((sum, d) => sum + d.disturbanceScore, 0) / disturbances.length 
                : 0,
            allStudents: disturbances.map(d => ({
                name: d.studentName,
                rollNumber: d.rollNumber,
                talkingDuration: d.talkingDuration,
                interruptions: d.interruptions,
                volumeLevel: d.volumeLevel,
                disturbanceScore: d.disturbanceScore
            }))
        };
        
        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get active session for lecturer
// @route   GET /api/sessions/active
exports.getActiveSession = async (req, res) => {
    try {
        const session = await Session.findOne({ lecturerId: req.user.id, isActive: true });
        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};