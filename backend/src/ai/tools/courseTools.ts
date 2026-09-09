import { CollegeCourse } from '../../models/CollegeCourse.js'
import { VideoCourse } from '../../models/VideoCourse.js'

export const courseTools = [
  {
    name: 'search_college_courses',
    description: 'Search private institutional college courses for authenticated student enrollment.',
    requiresAuth: true,
    execute: async (args: any, userContext: any) => {
      const q = args?.query || ''
      const courses = await CollegeCourse.find({
        $or: [
          { department: userContext.department || 'Computer Science' },
          { name: new RegExp(q, 'i') },
          { code: new RegExp(q, 'i') },
        ],
      }).limit(5).lean()

      if (!courses || courses.length === 0) {
        return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'No private college courses found matching your query.' }
      }

      return {
        hasData: true,
        type: 'PRIVATE_COLLEGE_COURSE',
        courses: courses.map((c: any) => ({
          title: c.title,
          courseCode: c.courseCode,
          department: c.department,
          semester: c.semester,
          credits: c.credits,
        })),
      }
    },
  },
  {
    name: 'search_public_courses',
    description: 'Search open public video course catalog (AWS, MongoDB, React, Node.js, Python, Java, Docker, Kubernetes, Cloud).',
    requiresAuth: false,
    execute: async (args: any) => {
      const q = args?.query || ''
      const courses = await VideoCourse.find({
        $or: [
          { title: new RegExp(q, 'i') },
          { category: new RegExp(q, 'i') },
          { tags: new RegExp(q, 'i') },
        ],
      }).limit(5).lean()

      if (!courses || courses.length === 0) {
        // Fallback default public catalog items if DB collection empty
        return {
          hasData: true,
          type: 'PUBLIC_VIDEO_COURSE',
          catalog: [
            { title: 'AWS Cloud Architect Certification', category: 'Cloud', duration: '12 Hours' },
            { title: 'Full Stack MERN Mastery', category: 'Web Development', duration: '24 Hours' },
            { title: 'Python for Data Science & ML', category: 'Artificial Intelligence', duration: '18 Hours' },
            { title: 'MongoDB Developer & Administrator Guide', category: 'Database', duration: '10 Hours' },
          ],
        }
      }

      return {
        hasData: true,
        type: 'PUBLIC_VIDEO_COURSE',
        courses: courses.map((c: any) => ({
          title: c.title,
          category: c.category,
          level: c.level,
          instructorName: c.instructorName,
        })),
      }
    },
  },
]
