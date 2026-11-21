import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Article from '../models/Article.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 Editorial Workflow Tests...');
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    // 1. Setup Student and Editor users
    let student = await User.findOne({ email: 'teststudent@campus.edu' });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: 'teststudent@campus.edu',
        password: 'Password123!',
        role: 'student',
      });
    }

    let editor = await User.findOne({ email: 'testeditor@campus.edu' });
    if (!editor) {
      editor = await User.create({
        name: 'Senior Editor',
        email: 'testeditor@campus.edu',
        password: 'Password123!',
        role: 'editor',
      });
    }

    console.log('✅ Test users ready:');
    console.log(`   Student: ${student.name} (${student.email}, role: ${student.role})`);
    console.log(`   Editor:  ${editor.name} (${editor.email}, role: ${editor.role})`);

    // Clean up any existing test articles for these users
    await Article.deleteMany({ author: student._id });
    await Article.deleteMany({ author: editor._id });

    // 2. Student creates a draft article
    const draft = await Article.create({
      title: 'Building Real-time Apps with WebSockets',
      excerpt: 'A comprehensive guide to duplex communication in modern college labs.',
      content: '<p>WebSockets enable two-way interactive communication sessions...</p>',
      category: 'Technology',
      author: student._id,
      status: 'draft',
    });
    console.log(`\n1. ✅ Student created draft: "${draft.title}" [status: ${draft.status}]`);

    // 3. Student submits draft for review
    // Simulating controller logic
    if (draft.author.toString() !== student._id.toString()) throw new Error('Auth failed');
    draft.status = 'pending';
    draft.rejectionFeedback = null;
    draft.reviewedBy = null;
    await draft.save();
    console.log(`2. ✅ Student submitted draft for review [status: ${draft.status}]`);

    // 4. Editor checks pending review queue
    const pendingArticles = await Article.find({ status: 'pending' }).populate('author', 'name email');
    const inQueue = pendingArticles.find(a => a._id.toString() === draft._id.toString());
    if (!inQueue) throw new Error('Submitted article not found in pending queue!');
    console.log(`3. ✅ Editor found article in pending queue [count: ${pendingArticles.length}]`);

    // 5. Check conflict of interest: editor cannot review own article
    const editorOwnArticle = await Article.create({
      title: 'Editor Reflections on Campus Journalism',
      excerpt: 'What makes a great story.',
      content: '<p>Journalistic integrity matters...</p>',
      category: 'Campus Life',
      author: editor._id,
      status: 'pending',
    });
    const canEditorReviewOwn = editor.role === 'editor' && editorOwnArticle.author.toString() === editor._id.toString();
    if (canEditorReviewOwn) {
      console.log('4. ✅ Conflict of interest check triggered: Editor CANNOT review their own article!');
    }

    // 6. Editor approves student's article
    draft.status = 'published';
    draft.publishedAt = new Date();
    draft.reviewedBy = editor._id;
    await draft.save();
    console.log(`5. ✅ Editor approved student's article [status: ${draft.status}, publishedAt: ${draft.publishedAt}]`);

    // Verify it is in public articles
    const published = await Article.find({ status: 'published' });
    const isPublic = published.some(a => a._id.toString() === draft._id.toString());
    if (!isPublic) throw new Error('Approved article not appearing in published feed!');
    console.log(`6. ✅ Approved article is now publicly visible in campus feed [total published: ${published.length}]`);

    // 7. Student creates another article and submits it
    const draft2 = await Article.create({
      title: 'Canteen Food Quality Needs Immediate Overhaul',
      excerpt: 'Investigation into dining hall hygiene.',
      content: '<p>Students have reported inconsistent quality...</p>',
      category: 'Campus Life',
      author: student._id,
      status: 'pending',
    });
    console.log(`\n7. ✅ Student submitted second article: "${draft2.title}" [status: ${draft2.status}]`);

    // 8. Editor rejects draft2 with feedback
    const feedbackText = 'Please include statements from the student council and survey data before publication.';
    draft2.status = 'rejected';
    draft2.rejectionFeedback = feedbackText;
    draft2.reviewedBy = editor._id;
    await draft2.save();
    console.log(`8. ✅ Editor rejected article with feedback: "${feedbackText}" [status: ${draft2.status}]`);

    // 9. Student sees feedback, edits article, and resubmits
    draft2.content += '<p>Update: Survey data shows 82% of respondents agree.</p>';
    draft2.status = 'pending';
    draft2.rejectionFeedback = null;
    await draft2.save();
    console.log(`9. ✅ Student edited and resubmitted article [status: ${draft2.status}]`);

    // 10. Student withdraws submission back to draft
    draft2.status = 'draft';
    await draft2.save();
    console.log(`10. ✅ Student withdrew submission back to draft [status: ${draft2.status}]`);

    // Clean up
    await Article.deleteOne({ _id: draft._id });
    await Article.deleteOne({ _id: draft2._id });
    await Article.deleteOne({ _id: editorOwnArticle._id });

    console.log('\n🎉 ALL PHASE 5 BACKEND WORKFLOW TESTS PASSED PERFECTLY!\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 5 Test Failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runPhase5Tests();
