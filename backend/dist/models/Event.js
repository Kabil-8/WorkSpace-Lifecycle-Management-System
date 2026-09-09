import mongoose, { Schema } from 'mongoose';
const EventSchema = new Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    eventType: {
        type: String,
        enum: ['hackathon', 'workshop', 'seminar', 'placement_drive', 'cultural', 'sports', 'tech_talk', 'exam'],
        default: 'workshop',
    },
    date: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String, default: 'Main Auditorium' },
    isOnline: { type: Boolean, default: false },
    meetLink: { type: String },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizerName: { type: String, required: true },
    attendees: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            name: { type: String },
            rsvpAt: { type: Date, default: Date.now },
        }],
    maxAttendees: { type: Number },
    tags: [{ type: String }],
    banner: { type: String },
    isPublished: { type: Boolean, default: true },
    department: { type: String },
    registrationDeadline: { type: Date },
}, { timestamps: true });
EventSchema.index({ title: 'text', description: 'text' });
export default mongoose.model('Event', EventSchema);
