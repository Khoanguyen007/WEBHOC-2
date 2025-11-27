const mongoose = require('mongoose');
const Course = require('../../models/Course');

describe('Course Model', () => {
  beforeEach(async () => {
    await Course.deleteMany({});
  });

  describe('Course Creation', () => {
    it('should create a course with valid data', async () => {
      const courseData = {
        title: 'JavaScript Fundamentals',
        description: 'Learn the basics of JavaScript programming',
        category: 'Programming',
        difficulty: 'Beginner',
        instructor: new mongoose.Types.ObjectId(),
        priceCents: 9999,
        thumbnail: 'https://example.com/thumb.jpg'
      };

      const course = await Course.create(courseData);
      expect(course).toBeDefined();
      expect(course.title).toBe('JavaScript Fundamentals');
      expect(course.priceCents).toBe(9999);
    });

    it('should fail to create course without required fields', async () => {
      const courseData = {
        title: 'Incomplete Course'
        // Missing required fields
      };

      try {
        await Course.create(courseData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('required');
      }
    });

    it('should set default values correctly', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test',
        category: 'Programming',
        difficulty: 'Intermediate',
        instructor: new mongoose.Types.ObjectId(),
        priceCents: 0
      };

      const course = await Course.create(courseData);
      expect(course.status).toBe('active');
      expect(course.priceCents).toBe(0);
      expect(Array.isArray(course.ratings)).toBe(true);
      expect(course.ratings.length).toBe(0);
    });
  });

  describe('Text Search', () => {
    beforeEach(async () => {
      await Course.create([
        {
          title: 'React Basics',
          description: 'Learn React fundamentals',
          category: 'Web Development',
          difficulty: 'Beginner',
          instructor: new mongoose.Types.ObjectId(),
          priceCents: 1999
        },
        {
          title: 'Advanced JavaScript',
          description: 'Master advanced JavaScript concepts',
          category: 'Programming',
          difficulty: 'Advanced',
          instructor: new mongoose.Types.ObjectId(),
          priceCents: 2999
        }
      ]);
    });

    it('should search courses by title', async () => {
      const results = await Course.find({
        $text: { $search: 'React' }
      }, {
        score: { $meta: 'textScore' }
      }).sort({ score: { $meta: 'textScore' } });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('React');
    });

    it('should search courses by description', async () => {
      const results = await Course.find({
        $text: { $search: 'fundamentals' }
      }, {
        score: { $meta: 'textScore' }
      }).sort({ score: { $meta: 'textScore' } });

      expect(results.length).toBeGreaterThan(0);
    });

    it('should prioritize title matches over description', async () => {
      // Create course with "React" in description but "JavaScript" in title
      await Course.create({
        title: 'JavaScript Fundamentals',
        description: 'Learn about React and other frameworks',
        category: 'Programming',
        difficulty: 'Beginner',
        instructor: new mongoose.Types.ObjectId(),
        priceCents: 1999
      });

      const results = await Course.find({
        $text: { $search: 'React' }
      }, {
        score: { $meta: 'textScore' }
      }).sort({ score: { $meta: 'textScore' } });

      // React Basics (in title) should rank higher than JavaScript course (in description)
      expect(results[0].title).toBe('React Basics');
    });
  });

  describe('Course Filtering', () => {
    beforeEach(async () => {
      await Course.create([
        {
          title: 'Beginner Python',
          description: 'Python basics',
          category: 'Programming',
          difficulty: 'Beginner',
          instructor: new mongoose.Types.ObjectId(),
          priceCents: 999,
          status: 'active'
        },
        {
          title: 'Advanced Python',
          description: 'Python advanced',
          category: 'Programming',
          difficulty: 'Advanced',
          instructor: new mongoose.Types.ObjectId(),
          priceCents: 2999,
          status: 'active'
        }
      ]);
    });

    it('should filter courses by difficulty', async () => {
      const results = await Course.find({ difficulty: 'Beginner' });
      expect(results.length).toBe(1);
      expect(results[0].difficulty).toBe('Beginner');
    });

    it('should filter courses by status', async () => {
      const results = await Course.find({ status: 'active' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(course => {
        expect(course.status).toBe('active');
      });
    });

    it('should exclude deleted courses', async () => {
      await Course.updateOne(
        { title: 'Beginner Python' },
        { deletedAt: new Date() }
      );

      const results = await Course.find({ deletedAt: null });
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Advanced Python');
    });
  });
});
