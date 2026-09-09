import AcademicAnalytics from '../models/AcademicAnalytics.js';
import User from '../models/User.js';
import Placement from '../models/Placement.js';
export class AnalyticsController {
    static async getInstitutionalAnalytics(req, res) {
        try {
            let analytics = await AcademicAnalytics.findOne().lean();
            const [totalStudents, totalFaculty, totalPlaced] = await Promise.all([
                User.countDocuments({ role: 'student' }),
                User.countDocuments({ role: 'faculty' }),
                Placement.countDocuments({ status: 'placed' }),
            ]);
            // Compute live average CGPA across all students
            const cgpaAgg = await User.aggregate([
                { $match: { role: 'student', cgpa: { $gt: 0 } } },
                { $group: { _id: null, avgCgpa: { $avg: '$cgpa' } } },
            ]);
            const avgCgpa = cgpaAgg.length > 0 ? Math.round(cgpaAgg[0].avgCgpa * 10) / 10 : 0;
            const placementRatePct = totalStudents > 0 ? Math.round((totalPlaced / totalStudents) * 100) : 0;
            // No synthetic/fallback data - real values only
            const responseData = {
                department: 'All Departments',
                academicYear: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
                retentionRatePct: analytics?.retentionRatePct || null,
                graduationRatePct: analytics?.graduationRatePct || null,
                placementRatePct: placementRatePct,
                avgCgpa: avgCgpa,
                totalRevenueUsd: analytics?.totalRevenueUsd || null,
                enrolledStudentsCount: totalStudents,
                activeFacultyCount: totalFaculty,
                // monthlyEnrollments only if verified data exists
                monthlyEnrollments: analytics?.monthlyEnrollments || null,
            };
            return res.json({
                success: true,
                data: responseData,
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
