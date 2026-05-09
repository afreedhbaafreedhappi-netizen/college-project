const mongoose = require('mongoose');

const disturbanceRecordSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentName: String,
    rollNumber: String,
    talkingDuration: {
        type: Number,
        default: 0
    },
    interruptions: {
        type: Number,
        default: 0
    },
    volumeLevel: {
        type: Number,
        default: 0
    },
    disturbanceScore: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const sessionSchema = new mongoose.Schema({
    lecturerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    className: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    disturbances: [disturbanceRecordSchema],
    audioRecordings: [{
        filename: String,
        uploadedAt: Date
    }]
});

// Method to add disturbance record
sessionSchema.methods.addDisturbance = function(studentId, studentName, rollNumber, talkingDuration, interruptions, volumeLevel) {
    const disturbanceScore = (interruptions * 5) + (talkingDuration * 2) + (volumeLevel * 3);
    
    const existingRecord = this.disturbances.find(d => d.studentId.toString() === studentId.toString());
    
    if (existingRecord) {
        existingRecord.talkingDuration += talkingDuration;
        existingRecord.interruptions += interruptions;
        existingRecord.volumeLevel = (existingRecord.volumeLevel + volumeLevel) / 2;
        existingRecord.disturbanceScore = (existingRecord.interruptions * 5) + (existingRecord.talkingDuration * 2) + (existingRecord.volumeLevel * 3);
    } else {
        this.disturbances.push({
            studentId,
            studentName,
            rollNumber,
            talkingDuration,
            interruptions,
            volumeLevel,
            disturbanceScore
        });
    }
    
    return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);