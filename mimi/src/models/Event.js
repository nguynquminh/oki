// src/models/Event.js
const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    username: { type: String, default: 'Unknown' },
}, { _id: false });

const teamSchema = new mongoose.Schema({
    teamIndex: { type: Number, required: true },
    members: [teamMemberSchema],
}, { _id: false });

const eventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    guildId: {
        type: String,
        required: true,
        index: true,
    },
    hostId: { type: String, required: true },
    hostTag: { type: String, default: 'Unknown' },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 1024 },
    mode: {
        type: String,
        enum: ['random', 'react'],
        required: true,
    },
    teamCount: { type: Number, required: true, min: 2, max: 5 },
    teams: [teamSchema],
    transcriptFiles: [{
        teamIndex: Number,
        fileName: String,
    }],
    participantCount: { type: Number, default: 0 },
    timestamps: {
        created: { type: Date, default: Date.now },
        started: { type: Date },
        ended: { type: Date },
    },
}, {
    collection: 'events',
    versionKey: false,
});

// Index compound cho query "tất cả events của guild X"
eventSchema.index({ guildId: 1, 'timestamps.created': -1 });

module.exports = mongoose.model('Event', eventSchema);