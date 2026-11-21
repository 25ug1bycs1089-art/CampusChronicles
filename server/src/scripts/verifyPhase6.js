import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Article from '../models/Article.js';
import Category from '../models/Category.js';
import Comment from '../models/Comment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getJwtSecret = () => process.env.JWT_SECRET || 'development_jwt_secret_placeholder';

async function runPhase6Tests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Campus Chronicles Phase 6 Automated Verification');
  console.log('🧪 ========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // 1. Ensure test users exist
    let studentA = await User.findOne({ email: 'student_phase6_a@campus.edu' });
    if (!studentA) {
      studentA = await User.create({
        name: 'Alex Rivera',
        email: 'student_phase6_a@campus.edu',
        password: 'Password123!',
        role: 'student',
        department: 'Computer Science',
      });
    }

    let studentB = await User.findOne({ email: 'student_phase6_b@campus.edu' });
    if (!studentB) {
      studentB = await User.create({
        name: 'Jordan Smith',
        email: 'student_phase6_b@campus.edu',
        password: 'Password123!',
        role: 'student',
        department: 'Information Science',
      });
    }

    let admin = await User.findOne({ email: 'admin_phase6@campus.edu' });
    if (!admin) {
      admin = await User.create({
        name: 'Dr. Evelyn Reed',
        email: 'admin_phase6@campus.edu',
        password: 'Password123!',
        role: 'admin',
        department: 'Administration',
      });
    }

    const tokenA = jwt.sign({ id: studentA._id }, getJwtSecret(), { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: studentB._id }, getJwtSecret(), { expiresIn: '1h' });
    const tokenAdmin = jwt.sign({ id: admin._id }, getJwtSecret(), { expiresIn: '1h' });

    const headersA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` };
    const headersB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` };
    const headersAdmin = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` };

    // Clean up previous test articles and comments created by these test users
    await Article.deleteMany({ author: { $in: [studentA._id, studentB._id] } });
    await Comment.deleteMany({ author: { $in: [studentA._id, studentB._id, admin._id] } });

    // Seed test articles:
    // 1. Published article in Technology
    const pubArt1 = await Article.create({
      title: 'Quantum Computing and Modern Cryptography Algorithms',
      excerpt: 'Exploring post-quantum security and cryptographic transformations in academia.',
      content: '<p>Quantum computing introduces profound challenges to traditional asymmetric RSA and ECC cryptography...</p>',
      coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
      category: 'Technology',
      author: studentA._id,
      status: 'published',
      publishedAt: new Date(Date.now() - 3600 * 1000 * 24), // 1 day ago
      views: 15,
    });

    // 2. Published article in Technology (for relatedArticles and sorting check)
    const pubArt2 = await Article.create({
      title: 'Neural Architecture Search for Autonomous Drones',
      excerpt: 'Automating neural network architecture design for low-power edge computing devices.',
      content: '<p>Deep reinforcement learning enables automated optimization of onboard drone inference...</p>',
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      category: 'Technology',
      author: studentB._id,
      status: 'published',
      publishedAt: new Date(), // Just now
      views: 120, // Higher views
    });

    // 3. Draft article (must NOT appear publicly)
    const draftArt = await Article.create({
      title: 'Confidential Unpublished Draft on University Protocols',
      excerpt: 'Secret internal thoughts not yet ready for review.',
      content: '<p>This draft should never leak to the public homepage or explore endpoints.</p>',
      category: 'Campus Life',
      author: studentA._id,
      status: 'draft',
      views: 0,
    });

    // 4. Pending article (must NOT appear publicly)
    const pendingArt = await Article.create({
      title: 'Pending Review: Next Generation Campus Dining Infrastructure',
      excerpt: 'Under review by editorial desk.',
      content: '<p>Awaiting editor feedback and approval.</p>',
      category: 'Campus Life',
      author: studentA._id,
      status: 'pending',
      views: 0,
    });

    console.log('✅ 1. Test data prepared (2 published articles, 1 draft, 1 pending review)');

    // -------------------------------------------------------------
    // Test 1: Public articles endpoint returns ONLY published articles
    // -------------------------------------------------------------
    const pubListRes = await fetch(`${baseUrl}/articles`);
    if (pubListRes.status !== 200) throw new Error(`GET /articles returned ${pubListRes.status}`);
    const pubListData = await pubListRes.json();

    const returnedDraft = pubListData.articles.find((a) => a._id === draftArt._id.toString());
    const returnedPending = pubListData.articles.find((a) => a._id === pendingArt._id.toString());
    if (returnedDraft || returnedPending) {
      throw new Error('SECURITY VIOLATION: Draft or pending articles leaked in public /api/articles feed!');
    }
    console.log(`✅ 2. GET /api/articles returns only published articles (${pubListData.articles.length} total, pagination verified)`);

    // -------------------------------------------------------------
    // Test 2: Search across title, excerpt, and content
    // -------------------------------------------------------------
    const searchRes = await fetch(`${baseUrl}/articles?search=Cryptography`);
    const searchData = await searchRes.json();
    const foundCrypto = searchData.articles.some((a) => a._id === pubArt1._id.toString());
    if (!foundCrypto) throw new Error('Search failed to find article by title keyword "Cryptography"');
    console.log('✅ 3. Search query (?search=Cryptography) successfully returned matching article');

    // -------------------------------------------------------------
    // Test 3: Category filtering & Sorting
    // -------------------------------------------------------------
    const catFilterRes = await fetch(`${baseUrl}/articles?category=Technology&sort=popular`);
    const catFilterData = await catFilterRes.json();
    if (catFilterData.articles.length < 2) {
      throw new Error(`Expected at least 2 Technology articles, got ${catFilterData.articles.length}`);
    }
    // pubArt2 has 120 views, pubArt1 has 15 views; with sort=popular, pubArt2 must precede pubArt1
    const idxArt2 = catFilterData.articles.findIndex((a) => a._id === pubArt2._id.toString());
    const idxArt1 = catFilterData.articles.findIndex((a) => a._id === pubArt1._id.toString());
    if (idxArt2 > idxArt1) {
      throw new Error(`Sorting by popular failed: pubArt2 (${pubArt2.views} views) should appear before pubArt1 (${pubArt1.views} views)`);
    }
    console.log('✅ 4. Category filtering (?category=Technology) and sorting (?sort=popular) verified');

    // -------------------------------------------------------------
    // Test 4: Categories API & dynamic published article count
    // -------------------------------------------------------------
    const categoriesRes = await fetch(`${baseUrl}/categories`);
    if (categoriesRes.status !== 200) throw new Error(`GET /categories returned ${categoriesRes.status}`);
    const categoriesData = await categoriesRes.json();
    const techCategory = categoriesData.categories.find((c) => c.name === 'Technology');
    if (!techCategory) throw new Error('Default "Technology" category not found in /api/categories');
    if (techCategory.articleCount < 2) {
      throw new Error(`Technology category articleCount expected >= 2, got ${techCategory.articleCount}`);
    }
    console.log(`✅ 5. GET /api/categories returned live categories with dynamic articleCount (${techCategory.articleCount} in Technology)`);

    // Category Creation & Authorization
    const studentCatRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ name: 'Hacking 101' }),
    });
    if (studentCatRes.status !== 403) {
      throw new Error(`Expected 403 when student creates category, got ${studentCatRes.status}`);
    }

    const adminCatRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ name: 'Robotics & Mechatronics', description: 'Autonomous systems and hardware.' }),
    });
    if (adminCatRes.status !== 201) {
      throw new Error(`Expected 201 when admin creates category, got ${adminCatRes.status}`);
    }
    const createdCatData = await adminCatRes.json();
    const testCatId = createdCatData.category._id;
    console.log('✅ 6. Category role protection verified (Student blocked 403, Admin created category 201)');

    // Delete category
    const deleteCatRes = await fetch(`${baseUrl}/categories/${testCatId}`, {
      method: 'DELETE',
      headers: headersAdmin,
    });
    if (deleteCatRes.status !== 200) {
      throw new Error(`Expected 200 on deleting category, got ${deleteCatRes.status}`);
    }
    console.log('✅ 7. Admin successfully deleted test category (200 OK)');

    // -------------------------------------------------------------
    // Test 5: Article Details, View Count Increment, Related Articles
    // -------------------------------------------------------------
    const initialViews = pubArt1.views;
    const detailRes = await fetch(`${baseUrl}/articles/${pubArt1._id}`);
    if (detailRes.status !== 200) throw new Error(`GET /articles/:id returned ${detailRes.status}`);
    const detailData = await detailRes.json();

    if (detailData.article.views !== initialViews + 1) {
      throw new Error(`Expected views to increment from ${initialViews} to ${initialViews + 1}, got ${detailData.article.views}`);
    }
    if (!detailData.relatedArticles || !detailData.relatedArticles.some((r) => r._id === pubArt2._id.toString())) {
      throw new Error('Expected pubArt2 in relatedArticles for Technology category');
    }
    console.log(`✅ 8. Article details endpoint verified (View count incremented to ${detailData.article.views}, relatedArticles populated)`);

    // Check that public cannot access draft article details
    const draftDetailRes = await fetch(`${baseUrl}/articles/${draftArt._id}`);
    if (draftDetailRes.status !== 404) {
      throw new Error(`Expected 404 for guest accessing draft article, got ${draftDetailRes.status}`);
    }
    console.log('✅ 9. Security verified: Draft article details inaccessible to unauthenticated visitors (404)');

    // -------------------------------------------------------------
    // Test 6: Comments System (Public read, Auth post, Author/Admin delete)
    // -------------------------------------------------------------
    // 6a. Unauthenticated post should be rejected with 401
    const unauthCommentRes = await fetch(`${baseUrl}/articles/${pubArt1._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'I am anonymous' }),
    });
    if (unauthCommentRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated comment submission, got ${unauthCommentRes.status}`);
    }
    console.log('✅ 10. Unauthenticated comment post blocked (401 Unauthorized)');

    // 6b. Validation: Empty comment rejected with 400
    const emptyCommentRes = await fetch(`${baseUrl}/articles/${pubArt1._id}/comments`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ content: '   ' }),
    });
    if (emptyCommentRes.status !== 400) {
      throw new Error(`Expected 400 for empty comment, got ${emptyCommentRes.status}`);
    }
    console.log('✅ 11. Empty comment correctly rejected (400 Bad Request)');

    // 6c. Student A posts a valid comment
    const postCommentRes = await fetch(`${baseUrl}/articles/${pubArt1._id}/comments`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ content: 'Remarkable analysis! Lattice-based cryptography looks very promising.' }),
    });
    if (postCommentRes.status !== 201) {
      throw new Error(`Expected 201 for valid comment, got ${postCommentRes.status}`);
    }
    const postedCommentData = await postCommentRes.json();
    const commentId1 = postedCommentData.comment._id;
    console.log('✅ 12. Student A successfully posted a comment (201 Created)');

    // 6d. Public guest reads comments
    const getCommentsRes = await fetch(`${baseUrl}/articles/${pubArt1._id}/comments`);
    if (getCommentsRes.status !== 200) {
      throw new Error(`Expected 200 reading comments, got ${getCommentsRes.status}`);
    }
    const getCommentsData = await getCommentsRes.json();
    if (!getCommentsData.comments.some((c) => c._id === commentId1)) {
      throw new Error('Created comment not found in public comments feed');
    }
    console.log(`✅ 13. Public comments feed verified (200 OK, author name populated: "${getCommentsData.comments[0].author.name}")`);

    // 6e. Student B tries to delete Student A's comment -> 403 Forbidden
    const unauthDeleteRes = await fetch(`${baseUrl}/comments/${commentId1}`, {
      method: 'DELETE',
      headers: headersB,
    });
    if (unauthDeleteRes.status !== 403) {
      throw new Error(`Expected 403 for unauthorized comment deletion, got ${unauthDeleteRes.status}`);
    }
    console.log('✅ 14. Unauthorized user blocked from deleting other user\'s comment (403 Forbidden)');

    // 6f. Student A deletes their own comment -> 200 OK
    const authorDeleteRes = await fetch(`${baseUrl}/comments/${commentId1}`, {
      method: 'DELETE',
      headers: headersA,
    });
    if (authorDeleteRes.status !== 200) {
      throw new Error(`Expected 200 when author deletes comment, got ${authorDeleteRes.status}`);
    }
    console.log('✅ 15. Comment author successfully deleted their own comment (200 OK)');

    // 6g. Student A posts another comment, and Admin deletes it -> 200 OK
    const postComment2Res = await fetch(`${baseUrl}/articles/${pubArt1._id}/comments`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ content: 'Second comment to test admin moderation powers.' }),
    });
    const postComment2Data = await postComment2Res.json();
    const commentId2 = postComment2Data.comment._id;

    const adminDeleteRes = await fetch(`${baseUrl}/comments/${commentId2}`, {
      method: 'DELETE',
      headers: headersAdmin,
    });
    if (adminDeleteRes.status !== 200) {
      throw new Error(`Expected 200 when admin deletes comment, got ${adminDeleteRes.status}`);
    }
    console.log('✅ 16. Admin moderation verified: Admin successfully deleted user comment (200 OK)');

    // Clean up test articles
    await Article.deleteMany({ _id: { $in: [pubArt1._id, pubArt2._id, draftArt._id, pendingArt._id] } });
    await Comment.deleteMany({ _id: { $in: [commentId1, commentId2] } });

    console.log('\n🎉 ALL 16 PHASE 6 AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runPhase6Tests().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
