import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Article from '../models/Article.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getJwtSecret = () => process.env.JWT_SECRET || 'development_jwt_secret_placeholder';

async function verifyAllPhase5Requirements() {
  console.log('===============================================================');
  console.log('   CAMPUS CHRONICLES — PHASE 5 END-TO-END WORKFLOW VERIFICATION');
  console.log('===============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // Setup test accounts: Student, Editor, and another Student
    let student = await User.findOne({ email: 'student.workflow@campus.edu' });
    if (!student) {
      student = await User.create({
        name: 'Aarav Patel',
        email: 'student.workflow@campus.edu',
        password: 'Password123!',
        role: 'student',
      });
    }

    let editor = await User.findOne({ email: 'editor.board@campus.edu' });
    if (!editor) {
      editor = await User.create({
        name: 'Prof. Ananya Sen',
        email: 'editor.board@campus.edu',
        password: 'Password123!',
        role: 'editor',
      });
    }

    let unauthorizedStudent = await User.findOne({ email: 'other.student@campus.edu' });
    if (!unauthorizedStudent) {
      unauthorizedStudent = await User.create({
        name: 'Rohan Verma',
        email: 'other.student@campus.edu',
        password: 'Password123!',
        role: 'student',
      });
    }

    const studentToken = jwt.sign({ id: student._id }, getJwtSecret(), { expiresIn: '1h' });
    const editorToken = jwt.sign({ id: editor._id }, getJwtSecret(), { expiresIn: '1h' });
    const otherStudentToken = jwt.sign({ id: unauthorizedStudent._id }, getJwtSecret(), { expiresIn: '1h' });

    const studentHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` };
    const editorHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${editorToken}` };
    const otherStudentHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${otherStudentToken}` };

    // Clean up past test articles
    await Article.deleteMany({ author: { $in: [student._id, unauthorizedStudent._id, editor._id] } });

    // -------------------------------------------------------------
    // Test 1: Student creates and saves an article as a draft
    // -------------------------------------------------------------
    console.log('TEST 1: Student creates and saves an article as a draft');
    const createRes = await fetch(`${baseUrl}/articles`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        title: 'Understanding Distributed Consensus in Modern Cloud Labs',
        excerpt: 'An undergraduate perspective on Raft, Paxos, and fault-tolerant architecture.',
        content: '<p>Consensus algorithms are fundamental to distributed database clusters...</p>',
        category: 'Technology',
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || createData.article.status !== 'draft') {
      throw new Error(`Test 1 Failed: Status is ${createData.article?.status}, expected 201 and draft`);
    }
    const articleId1 = createData.article._id;
    console.log(`  ➔ PASS: Draft created with ID "${articleId1}", status: "${createData.article.status}"\n`);

    // -------------------------------------------------------------
    // Test 2: Student submits it for review
    // -------------------------------------------------------------
    console.log('TEST 2: Student submits completed draft for editorial review');
    const submitRes = await fetch(`${baseUrl}/articles/${articleId1}/submit`, {
      method: 'PUT',
      headers: studentHeaders,
    });
    const submitData = await submitRes.json();
    if (submitRes.status !== 200 || submitData.article.status !== 'pending') {
      throw new Error(`Test 2 Failed: Status is ${submitData.article?.status}, expected 200 and pending`);
    }
    console.log(`  ➔ PASS: Article submitted, status is now: "${submitData.article.status}"\n`);

    // -------------------------------------------------------------
    // Test 3: Article appears in editor's pending submissions
    // -------------------------------------------------------------
    console.log('TEST 3: Article appears in editor\'s pending submissions');
    const pendingRes = await fetch(`${baseUrl}/articles/pending`, {
      method: 'GET',
      headers: editorHeaders,
    });
    const pendingData = await pendingRes.json();
    const foundInQueue = pendingData.articles.find(a => a._id === articleId1);
    if (!foundInQueue) {
      throw new Error('Test 3 Failed: Article not found in editor pending queue');
    }
    console.log(`  ➔ PASS: Editor retrieved queue (${pendingData.count} pending), article found: "${foundInQueue.title}"\n`);

    // -------------------------------------------------------------
    // Test 4: Editor approves article and it becomes publicly visible
    // -------------------------------------------------------------
    console.log('TEST 4: Editor approves article and it becomes publicly visible');
    const approveRes = await fetch(`${baseUrl}/articles/${articleId1}/approve`, {
      method: 'PUT',
      headers: editorHeaders,
    });
    const approveData = await approveRes.json();
    if (approveRes.status !== 200 || approveData.article.status !== 'published' || !approveData.article.publishedAt) {
      throw new Error('Test 4 Failed: Could not approve article or publishedAt was missing');
    }
    console.log(`  ➔ PASS: Article approved, status is "${approveData.article.status}", publishedAt: ${approveData.article.publishedAt}`);

    // Verify it is on public feed
    const publicRes = await fetch(`${baseUrl}/articles`);
    const publicData = await publicRes.json();
    const inPublic = publicData.articles.some(a => a._id === articleId1);
    if (!inPublic) {
      throw new Error('Test 4 Failed: Article not visible on public feed');
    }
    console.log('  ➔ PASS: Article successfully verified in public feed (GET /api/articles)\n');

    // -------------------------------------------------------------
    // Test 5: Editor rejects another article with feedback
    // -------------------------------------------------------------
    console.log('TEST 5: Editor rejects another article with required feedback');
    // Student creates article 2
    const createRes2 = await fetch(`${baseUrl}/articles`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        title: 'Revamping the Campus Cafeteria Meal Plan',
        excerpt: 'An investigative report into nutrition, pricing, and student choices.',
        content: '<p>Many freshmen struggle with limited late-night dining hours...</p>',
        category: 'Campus Life',
      }),
    });
    const articleId2 = (await createRes2.json()).article._id;
    // Student submits article 2
    await fetch(`${baseUrl}/articles/${articleId2}/submit`, { method: 'PUT', headers: studentHeaders });

    // 5a. Editor tries to reject without feedback (Must fail with 400)
    const rejectNoFeedbackRes = await fetch(`${baseUrl}/articles/${articleId2}/reject`, {
      method: 'PUT',
      headers: editorHeaders,
      body: JSON.stringify({ feedback: '   ' }),
    });
    if (rejectNoFeedbackRes.status !== 400) {
      throw new Error('Test 5 Failed: Reject without feedback was not rejected with 400');
    }
    console.log('  ➔ PASS: Reject without feedback correctly blocked (400 Bad Request)');

    // 5b. Editor rejects with valid feedback
    const feedbackMsg = 'Great topic! Please interview at least 3 residential students and quote the dining services manager before resubmission.';
    const rejectRes = await fetch(`${baseUrl}/articles/${articleId2}/reject`, {
      method: 'PUT',
      headers: editorHeaders,
      body: JSON.stringify({ feedback: feedbackMsg }),
    });
    const rejectData = await rejectRes.json();
    if (rejectRes.status !== 200 || rejectData.article.status !== 'rejected' || rejectData.article.rejectionFeedback !== feedbackMsg) {
      throw new Error('Test 5 Failed: Rejection feedback was not properly saved');
    }
    console.log(`  ➔ PASS: Article rejected, status: "${rejectData.article.status}", feedback: "${rejectData.article.rejectionFeedback}"\n`);

    // -------------------------------------------------------------
    // Test 6: Student sees rejection feedback, edits, and resubmits
    // -------------------------------------------------------------
    console.log('TEST 6: Student views feedback, edits article, and resubmits');
    // Student fetches their articles
    const myArticlesRes = await fetch(`${baseUrl}/articles/my`, { headers: studentHeaders });
    const myArticlesData = await myArticlesRes.json();
    const rejectedArticleInList = myArticlesData.articles.find(a => a._id === articleId2);
    if (!rejectedArticleInList || !rejectedArticleInList.rejectionFeedback) {
      throw new Error('Test 6 Failed: Rejection feedback not present in author article list');
    }
    console.log(`  ➔ PASS: Author retrieved article with feedback: "${rejectedArticleInList.rejectionFeedback}"`);

    // Student edits rejected article
    const editRes = await fetch(`${baseUrl}/articles/${articleId2}`, {
      method: 'PUT',
      headers: studentHeaders,
      body: JSON.stringify({
        content: '<p>Many freshmen struggle with hours. Interviewed 3 students: Rahul, Sneha, and Maya all agreed that breakfast options are insufficient.</p>',
      }),
    });
    if (editRes.status !== 200) {
      throw new Error('Test 6 Failed: Could not edit rejected article');
    }
    console.log('  ➔ PASS: Student successfully edited rejected article draft');

    // Student resubmits for review
    const resubmitRes = await fetch(`${baseUrl}/articles/${articleId2}/submit`, {
      method: 'PUT',
      headers: studentHeaders,
    });
    const resubmitData = await resubmitRes.json();
    if (resubmitRes.status !== 200 || resubmitData.article.status !== 'pending' || resubmitData.article.rejectionFeedback !== null) {
      throw new Error('Test 6 Failed: Resubmit did not clear feedback or set pending status');
    }
    console.log(`  ➔ PASS: Article resubmitted successfully, status: "${resubmitData.article.status}", previous feedback cleared\n`);

    // -------------------------------------------------------------
    // Test 7: Unauthorized users cannot access editorial actions or unpublished articles
    // -------------------------------------------------------------
    console.log('TEST 7: Unauthorized access controls and boundary checks');
    // 7a. Non-editor accessing pending queue
    const unauthQueueRes = await fetch(`${baseUrl}/articles/pending`, { headers: otherStudentHeaders });
    if (unauthQueueRes.status !== 403) {
      throw new Error('Test 7 Failed: Student was not forbidden from accessing /pending');
    }
    console.log('  ➔ PASS: Student blocked from /api/articles/pending (403 Forbidden)');

    // 7b. Non-editor approving an article
    const unauthApproveRes = await fetch(`${baseUrl}/articles/${articleId2}/approve`, {
      method: 'PUT',
      headers: otherStudentHeaders,
    });
    if (unauthApproveRes.status !== 403) {
      throw new Error('Test 7 Failed: Student was not forbidden from approving');
    }
    console.log('  ➔ PASS: Student blocked from approving articles (403 Forbidden)');

    // 7c. Non-author, non-editor viewing unpublished pending article
    const unauthViewRes = await fetch(`${baseUrl}/articles/${articleId2}`, { headers: otherStudentHeaders });
    if (unauthViewRes.status !== 403) {
      throw new Error('Test 7 Failed: Unauthorized user was able to view unpublished pending article');
    }
    console.log('  ➔ PASS: Third-party student blocked from viewing unpublished pending article (403 Forbidden)');

    // 7d. Public guest viewing unpublished pending article
    const guestViewRes = await fetch(`${baseUrl}/articles/${articleId2}`);
    if (guestViewRes.status !== 401) {
      throw new Error('Test 7 Failed: Unauthenticated guest was not blocked from viewing unpublished article');
    }
    console.log('  ➔ PASS: Unauthenticated guest blocked from viewing unpublished article (401 Unauthorized)\n');

    // -------------------------------------------------------------
    // Test 8: Students cannot approve or directly publish their own articles
    // -------------------------------------------------------------
    console.log('TEST 8: Students cannot approve or directly publish their own articles');
    // 8a. Student calling approve endpoint on their own article
    const studentApproveOwnRes = await fetch(`${baseUrl}/articles/${articleId2}/approve`, {
      method: 'PUT',
      headers: studentHeaders,
    });
    if (studentApproveOwnRes.status !== 403) {
      throw new Error('Test 8 Failed: Student could approve their own article');
    }
    console.log('  ➔ PASS: Student cannot call approve endpoint on their own article (403 Forbidden)');

    // 8b. Student attempting to alter status to "published" via PUT /api/articles/:id
    const studentTamperRes = await fetch(`${baseUrl}/articles/${articleId2}`, {
      method: 'PUT',
      headers: studentHeaders,
      body: JSON.stringify({ status: 'published' }),
    });
    // Since article is pending, direct edit is rejected with 400
    if (studentTamperRes.status !== 400) {
      throw new Error('Test 8 Failed: Direct edit on pending article should be rejected');
    }
    console.log('  ➔ PASS: Direct status alteration on pending article is strictly rejected (400 Bad Request)');

    // 8c. Test withdraw functionality
    const withdrawRes = await fetch(`${baseUrl}/articles/${articleId2}/withdraw`, {
      method: 'PUT',
      headers: studentHeaders,
    });
    const withdrawData = await withdrawRes.json();
    if (withdrawRes.status !== 200 || withdrawData.article.status !== 'draft') {
      throw new Error('Test 8 Failed: Withdraw failed to return article to draft');
    }
    console.log(`  ➔ PASS: Student can withdraw pending submission back to draft status: "${withdrawData.article.status}"`);

    // Clean up
    await Article.deleteMany({ _id: { $in: [articleId1, articleId2] } });

    console.log('\n===============================================================');
    console.log('🎉 ALL 8 EDITORIAL WORKFLOW VERIFICATION TESTS PASSED 100%!');
    console.log('===============================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyAllPhase5Requirements();
