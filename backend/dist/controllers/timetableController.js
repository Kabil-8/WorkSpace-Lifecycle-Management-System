import TimetableItem from '../models/Timetable.js';
export class TimetableController {
    /**
     * GET /api/v1/timetable
     * Returns section-specific timetable items for department, semester, and section
     */
    static async getTimetable(req, res) {
        try {
            const isStudent = req.user.role === 'student';
            const department = isStudent ? (req.user.department || 'Computer Science') : (req.query.department || req.user.department || 'Computer Science');
            const semester = parseInt(req.query.semester || (req.user.semester ? String(req.user.semester) : '7'), 10);
            // Students MUST view ONLY their own assigned section
            const section = isStudent ? (req.user.section || 'Section A') : (req.query.section || req.user.section || 'Section A');
            const items = await TimetableItem.find({ department, semester, section }).sort({ day: 1, startPeriod: 1 });
            return res.json({ success: true, data: items, department, semester, section });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/timetable
     * Creates a new period slot for a class section (Faculty/Admin)
     */
    static async createPeriodSlot(req, res) {
        try {
            const { department, semester, section, day, startPeriod, duration, subject, room, type, color, instructorName, } = req.body;
            if (!subject || !room || day === undefined || startPeriod === undefined) {
                return res.status(400).json({ success: false, message: 'Subject, room, day, and startPeriod are required.' });
            }
            const newItem = await TimetableItem.create({
                department: department || req.user.department || 'Computer Science',
                semester: semester ? parseInt(semester, 10) : 7,
                section: section || 'Section A',
                day: parseInt(day, 10),
                startPeriod: parseInt(startPeriod, 10),
                duration: duration ? parseInt(duration, 10) : 1,
                subject,
                room,
                type: type || 'Lecture',
                color: color || '#2563EB',
                instructorName: instructorName || req.user.name,
                allocatedById: req.user._id,
                allocatedByName: req.user.name,
            });
            return res.status(201).json({ success: true, data: newItem, message: 'Timetable period slot allocated successfully ✓' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * PUT /api/v1/timetable/:id
     * Updates an existing timetable period slot
     */
    static async updatePeriodSlot(req, res) {
        try {
            const { id } = req.params;
            const updated = await TimetableItem.findByIdAndUpdate(id, req.body, { new: true });
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Timetable slot not found' });
            }
            return res.json({ success: true, data: updated, message: 'Timetable slot updated ✓' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * DELETE /api/v1/timetable/:id
     * Deletes a timetable period slot
     */
    static async deletePeriodSlot(req, res) {
        try {
            const { id } = req.params;
            const deleted = await TimetableItem.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Timetable slot not found' });
            }
            return res.json({ success: true, message: 'Timetable slot deleted ✓' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
