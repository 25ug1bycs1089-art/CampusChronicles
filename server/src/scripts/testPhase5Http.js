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

async function runHttpTests() {
  console.log('🚀 Starting Phase 5 HTTP API Endpoint Tests...');
  await mongoose.connect(process.env.MONGODB_URI);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    const student = await User.findOne({ email: 'teststudent@campus.edu' });
    const editor = await User.findOne({ email: 'testeditor@campus.edu' });

    const studentToken = jwt.sign({ id: student._id }, getJwtSecret(), { expiresIn: '1h' });
    const editorToken = jwt.sign({ id: editor._id }, getJwtSecret(), { expiresIn: '1h' });

    const studentHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`,
    };
    const editorHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${editorToken}`,
    };

    // 1. Verify Student CANNOT access GET /api/articles/pending (Must return 403 Forbidden)
    const pendingStudentRes = await fetch(`${baseUrl}/articles/pending`, { headers: studentHeaders });
    if (pendingStudentRes.status !== 403) {
      throw new Error(`Expected 403 for student accessing /pending, got ${pendingStudentRes.status}`);
    }
    console.log('✅ 1. Student correctly blocked from /api/articles/pending (403 Forbidden)');

    // 2. Editor CAN access GET /api/articles/pending
    const pendingEditorRes = await fetch(`${baseUrl}/articles/pending`, { headers: editorHeaders });
    if (pendingEditorRes.status !== 200) {
      throw new Error(`Expected 200 for editor accessing /pending, got ${pendingEditorRes.status}`);
    }
    const pendingData = await pendingEditorRes.json();
    console.log(`✅ 2. Editor successfully accessed /api/articles/pending (200 OK, queue count: ${pendingData.count})`);

    // 3. Student creates an article via POST /api/articles
    const createRes = await fetch(`${baseUrl}/articles`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        title: 'Microservices in Campus ERP',
        excerpt: 'Decoupling monolithic student registration systems with event brokers.',
        content: '<p>Distributed systems solve peak load spikes during course enrollment...</p>',
        category: 'Technology',
      }),
    });
    if (createRes.status !== 201) throw new Error(`Create article failed: ${createRes.status}`);
    const createData = await createRes.json();
    const articleId = createData.article._id;
    console.log(`✅ 3. Student created draft article via POST /api/articles [status: ${createData.article.status}]`);

    // 4. Student tries to edit protected fields directly (status: 'published')
    const tamperRes = await fetch(`${baseUrl}/articles/${articleId}`, {
      method: 'PUT',
      headers: studentHeaders,
      body: JSON.stringify({
        title: 'Microservices in Campus ERP (Updated)',
        status: 'published',
      }),
    });
    const tamperData = await tamperRes.json();
    if (tamperData.article.status === 'published') {
      throw new Error('SECURITY BREACH: Student was able to set status to published via PUT /api/articles/:id!');
    }
    console.log(`✅ 4. Security check passed: Protected field 'status' was NOT overwritten [status remains: ${tamperData.article.status}]`);

    // 5. Student submits article for review via PUT /api/articles/:id/submit
    const submitRes = await fetch(`${baseUrl}/articles/${articleId}/submit`, {
      method: 'PUT',
      headers: studentHeaders,
    });
    if (submitRes.status !== 200) throw new Error(`Submit failed: ${submitRes.status}`);
    const submitData = await submitRes.json();
    if (submitData.article.status !== 'pending') throw new Error('Status not set to pending');
    console.log(`✅ 5. Student submitted article via PUT /api/articles/:id/submit [status: ${submitData.article.status}]`);

    // 6. Student withdraws submission via PUT /api/articles/:id/withdraw
    const withdrawRes = await fetch(`${baseUrl}/articles/${articleId}/withdraw`, {
      method: 'PUT',
      headers: studentHeaders,
    });
    if (withdrawRes.status !== 200) throw new Error(`Withdraw failed: ${withdrawRes.status}`);
    const withdrawData = await withdrawRes.json();
    if (withdrawData.article.status !== 'draft') throw new Error('Status not returned to draft');
    console.log(`✅ 6. Student withdrew submission via PUT /api/articles/:id/withdraw [status: ${withdrawData.article.status}]`);

    // 7. Student resubmits so editor can reject it
    await fetch(`${baseUrl}/articles/${articleId}/submit`, { method: 'PUT', headers: studentHeaders });

    // 8. Editor rejects with feedback via PUT /api/articles/:id/reject
    // 8a. Test empty feedback failure
    const emptyRejectRes = await fetch(`${baseUrl}/articles/${articleId}/reject`, {
      method: 'PUT',
      headers: editorHeaders,
      body: JSON.stringify({ feedback: '' }),
    });
    if (emptyRejectRes.status !== 400) throw new Error('Expected 400 when rejection feedback is empty');
    console.log('✅ 8a. Mandatory feedback validation passed (400 Bad Request on empty feedback)');

    // 8b. Reject with valid feedback
    const rejectRes = await fetch(`${baseUrl}/articles/${articleId}/reject`, {
      method: 'PUT',
      headers: editorHeaders,
      body: JSON.stringify({ feedback: 'Please add architecture diagrams and latency benchmarks.' }),
    });
    if (rejectRes.status !== 200) throw new Error(`Reject failed: ${rejectRes.status}`);
    const rejectData = await rejectRes.json();
    if (rejectData.article.status !== 'rejected') throw new Error('Status not rejected');
    console.log(`✅ 8b. Editor rejected article with feedback via PUT /api/articles/:id/reject [status: ${rejectData.article.status}]`);

    // 9. Student edits the rejected article and resubmits
    const updateRejectedRes = await fetch(`${baseUrl}/articles/${articleId}`, {
      method: 'PUT',
      headers: studentHeaders,
      body: JSON.stringify({
        content: '<p>Distributed systems solve peak load spikes. Added architecture diagrams below...</p>',
      }),
    });
    if (updateRejectedRes.status !== 200) throw new Error(`Editing rejected article failed: ${updateRejectedRes.status}`);
    console.log('✅ 9a. Student successfully edited rejected article draft');

    const resubmitRes = await fetch(`${baseUrl}/articles/${articleId}/submit`, {
      method: 'PUT',
      headers: studentHeaders,
    });
    if (resubmitRes.status !== 200) throw new Error(`Resubmit failed: ${resubmitRes.status}`);
    console.log('✅ 9b. Student resubmitted revised article for review');

    // 10. Editor approves article via PUT /api/articles/:id/approve
    const approveRes = await fetch(`${baseUrl}/articles/${articleId}/approve`, {
      method: 'PUT',
      headers: editorHeaders,
    });
    if (approveRes.status !== 200) throw new Error(`Approve failed: ${approveRes.status}`);
    const approveData = await approveRes.json();
    if (approveData.article.status !== 'published') throw new Error('Status not published');
    if (!approveData.article.publishedAt) throw new Error('publishedAt date not set');
    console.log(`✅ 10. Editor approved article via PUT /api/articles/:id/approve [status: ${approveData.article.status}, publishedAt: ${approveData.article.publishedAt}]`);

    // 11. Public feed check
    const publicRes = await fetch(`${baseUrl}/articles`);
    const publicData = await publicRes.json();
    const foundInPublic = publicData.articles.some(a => a._id === articleId);
    if (!foundInPublic) throw new Error('Approved article not found in public GET /api/articles feed!');
    console.log(`✅ 11. Article successfully appeared in public feed GET /api/articles (total: ${publicData.articles.length})`);

    // Clean up
    await Article.deleteOne({ _id: articleId });

    console.log('\n🏆 ALL PHASE 5 HTTP ENDPOINT TESTS PASSED WITH 100% SUCCESS!\n');
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ HTTP Test Failed:', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runHttpTests();
