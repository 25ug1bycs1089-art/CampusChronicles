// Campus Chronicles - Comprehensive Mock Data Store

export const mockCategories = [
  {
    id: 'tech',
    slug: 'technology',
    name: 'Technology',
    description: 'Emerging tech, gadgets, AI developments, and tech culture on campus.',
    iconName: 'Cpu',
    color: 'indigo',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    articleCount: 14
  },
  {
    id: 'programming',
    slug: 'programming',
    name: 'Programming',
    description: 'Coding tutorials, project architectures, algorithms, and developer tools.',
    iconName: 'Code',
    color: 'emerald',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    articleCount: 19
  },
  {
    id: 'campus-life',
    slug: 'campus-life',
    name: 'Campus Life',
    description: 'Hostel stories, cafeteria reviews, student clubs, and daily campus culture.',
    iconName: 'Coffee',
    color: 'amber',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    articleCount: 22
  },
  {
    id: 'academics',
    slug: 'academics',
    name: 'Academics',
    description: 'Study techniques, semester roadmaps, research papers, and lab survival guides.',
    iconName: 'GraduationCap',
    color: 'blue',
    coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    articleCount: 11
  },
  {
    id: 'career',
    slug: 'career-placements',
    name: 'Career & Placements',
    description: 'Internship diaries, placement interview questions, resumes, and alumni advice.',
    iconName: 'Briefcase',
    color: 'rose',
    coverImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
    articleCount: 16
  },
  {
    id: 'events',
    slug: 'events',
    name: 'Events',
    description: 'College fests, hackathons, sports meets, cultural nights, and guest seminars.',
    iconName: 'Calendar',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    articleCount: 15
  },
  {
    id: 'entertainment',
    slug: 'entertainment',
    name: 'Entertainment',
    description: 'Movie reviews, book recommendations, campus memes, and musical playlists.',
    iconName: 'Film',
    color: 'pink',
    coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    articleCount: 9
  },
  {
    id: 'personal',
    slug: 'personal-experiences',
    name: 'Personal Experiences',
    description: 'Reflective memoirs, lessons learned, mental health, and growing up in college.',
    iconName: 'Heart',
    color: 'teal',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    articleCount: 13
  }
];

export const mockAuthors = [
  {
    id: 'author-1',
    name: 'Aarav Sharma',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    role: 'Student Editor',
    department: 'Computer Science, Year 3',
    bio: 'Full-stack builder, open-source enthusiast, and editor at Campus Chronicles.'
  },
  {
    id: 'author-2',
    name: 'Priya Nambiar',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    role: 'Staff Writer',
    department: 'Electrical Engineering, Year 4',
    bio: 'Passionate about robotics, renewable energy tech, and mentoring freshmen.'
  },
  {
    id: 'author-3',
    name: 'Rohan Verma',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    role: 'Contributor',
    department: 'Mechanical Engineering, Year 2',
    bio: 'Formula Student lead designer and campus automotive columnist.'
  },
  {
    id: 'author-4',
    name: 'Ananya Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    role: 'Senior Editor',
    department: 'Information Technology, Year 4',
    bio: 'Interned at Google Summer of Code; writes about career roadmaps and placements.'
  }
];

export const mockArticles = [
  {
    id: 'art-1',
    title: 'Navigating Your First Semester in Tech: Lessons from a Final-Year Senior',
    slug: 'navigating-first-semester-tech',
    excerpt: 'Stepping into engineering can feel overwhelming. From choosing your primary programming language to joining active student clubs, here is the honest roadmap I wish I had.',
    content: `
      <p>Entering college with hundreds of peers who seem to already know how to build neural networks can feel intimidating. Take a deep breath: <strong>nobody has it all figured out on Day 1</strong>.</p>
      
      <h3>1. Depth Over Breadth in Year 1</h3>
      <p>It is tempting to collect certificates in Python, Rust, Go, Flutter, and Kubernetes all in your first six months. Resist this urge. Master one core language deeply—preferably C++ or Java if you want solid fundamentals, or Python/JavaScript for quick prototyping.</p>
      
      <blockquote>
        "The best developers are not those who know ten languages superficially, but those who can break down a hard problem cleanly in one."
      </blockquote>

      <h3>2. The Power of Campus Tech Communities</h3>
      <p>Our campus developer circles and hackathon clubs host weekly build sessions. Surround yourself with peers who push you to deploy projects rather than just watching video tutorials.</p>

      <h3>3. Keep an Eye on Consistency</h3>
      <p>Code for 45 minutes every evening rather than doing an 8-hour binge once a month. The compounding effect of small daily habits will give you unfair advantages when internship season arrives.</p>
    `,
    category: 'Academics',
    categorySlug: 'academics',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    author: mockAuthors[0],
    publishedAt: '2026-11-18',
    readTime: '5 min read',
    views: 1420,
    likes: 88,
    isFeatured: true,
    isEditorsPick: true,
    status: 'published'
  },
  {
    id: 'art-2',
    title: 'Inside HackCampus 2026: 36 Hours, 80 Teams, and the Winning Projects',
    slug: 'inside-hackcampus-2026',
    excerpt: 'An inside look at our annual 36-hour flagship hackathon: sleepless nights in the central library, hardware prototypes, and the AI healthcare tool that won Grand Prize.',
    content: `
      <p>Last weekend, the campus auditorium hummed with the sound of mechanical keyboards, caffeinated debriefs, and frantic Git merges as <strong>HackCampus 2026</strong> unfolded.</p>

      <h3>The Winning Project: PulseScan</h3>
      <p>Team NeuroLink took home the $2,500 grand prize with PulseScan—a lightweight mobile utility that performs early thermal screening and preliminary symptom logging for remote rural clinics using local edge models.</p>

      <h3>What the Judges Highlighted</h3>
      <p>Jurors noted that while many teams built flashy frontends, the top three projects won because their <em>problem formulation was tightly grounded in genuine community needs</em>.</p>
    `,
    category: 'Events',
    categorySlug: 'events',
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    author: mockAuthors[1],
    publishedAt: '2026-11-15',
    readTime: '6 min read',
    views: 2150,
    likes: 142,
    isFeatured: true,
    isEditorsPick: false,
    status: 'published'
  },
  {
    id: 'art-3',
    title: 'Demystifying Product-Based Company Placements: A Comprehensive Prep Blueprint',
    slug: 'demystifying-placements-blueprint',
    excerpt: 'Everything you need to systematically prepare for Tier-1 software engineering interviews: DSA milestones, system design essentials, and behavioral prep.',
    content: `
      <p>Placement season can feel like a high-stakes marathon. Having mentored over 40 juniors through summer hiring drives, here is how you can structure your preparation timeline.</p>

      <h3>Phase 1: Data Structures & Problem Solving (Months 1-3)</h3>
      <p>Focus on patterns rather than memorizing problem numbers. Master Sliding Window, Two Pointers, Tree Traversals, and Dynamic Programming foundations.</p>

      <h3>Phase 2: High-Quality Portfolio Projects (Month 4)</h3>
      <p>Replace generic e-commerce clones with real distributed or community tools. A campus event booking engine with concurrency handling stands out 10x more to recruiters.</p>
    `,
    category: 'Career & Placements',
    categorySlug: 'career-placements',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    author: mockAuthors[3],
    publishedAt: '2026-11-12',
    readTime: '8 min read',
    views: 3410,
    likes: 240,
    isFeatured: false,
    isEditorsPick: true,
    status: 'published'
  },
  {
    id: 'art-4',
    title: 'Why Every Engineering Student Should Try Building an Open Source Project',
    slug: 'why-build-open-source',
    excerpt: 'Writing code for yourself is great. Writing code that strangers across the globe clone, review, and rely on will change how you think about software craftsmanship.',
    content: `
      <p>When you publish your first library on GitHub or contribute a pull request to a major repository, the fear of public code review quickly transforms into your greatest learning asset.</p>
      <p>You learn git workflows, clean documentation, CI/CD pipelines, and empathetic collaboration—skills that no college syllabus can fully recreate in an exam hall.</p>
    `,
    category: 'Programming',
    categorySlug: 'programming',
    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80',
    author: mockAuthors[0],
    publishedAt: '2026-11-10',
    readTime: '4 min read',
    views: 1205,
    likes: 76,
    isFeatured: false,
    isEditorsPick: false,
    status: 'published'
  },
  {
    id: 'art-5',
    title: 'The Untapped Quiet Corners: A Definitive Guide to Campus Study Spots',
    slug: 'campus-quiet-study-spots-guide',
    excerpt: 'Tired of fighting for library seats during midterms? We scouted and rated 6 peaceful, distraction-free study spots across campus with good Wi-Fi and power outlets.',
    content: `
      <p>Finding a peaceful workspace during exam crunch periods can feel like an Olympic sport. We spent two weeks auditing study locations across North and South blocks.</p>
      <h3>Top Pick: 4th Floor Reading Alcove (Science Block)</h3>
      <p>Abundant natural light, silent policy strictly respected, and charging ports at every mahogany desk.</p>
    `,
    category: 'Campus Life',
    categorySlug: 'campus-life',
    coverImage: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80',
    author: mockAuthors[2],
    publishedAt: '2026-11-08',
    readTime: '4 min read',
    views: 1890,
    likes: 115,
    isFeatured: false,
    isEditorsPick: false,
    status: 'published'
  },
  {
    id: 'art-6',
    title: 'The Rise of Agentic AI: What it Means for the Next Generation of CS Grads',
    slug: 'rise-of-agentic-ai-cs-grads',
    excerpt: 'As LLMs transition from conversational bots to autonomous execution agents, what skill sets should current students cultivate to stay genuinely competitive?',
    content: `
      <p>The conversation around AI has dramatically shifted. It is no longer just about prompt generation—it is about orchestrating multi-agent systems, deterministic validation layers, and deep domain modeling.</p>
      <p>Engineers who understand system boundaries, security sandboxing, and data provenance will be the ones steering these intelligent workflows.</p>
    `,
    category: 'Technology',
    categorySlug: 'technology',
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    author: mockAuthors[1],
    publishedAt: '2026-11-05',
    readTime: '7 min read',
    views: 2840,
    likes: 198,
    isFeatured: false,
    isEditorsPick: true,
    status: 'published'
  },
  {
    id: 'art-7',
    title: 'Dealing with Imposter Syndrome During Freshman Year: You Belong Here',
    slug: 'dealing-with-imposter-syndrome',
    excerpt: 'An honest reflection on feeling inadequate among brilliant classmates, overcoming self-doubt, and finding your own pace in a competitive university ecosystem.',
    content: `
      <p>In my first week of college, my roommate was discussing distributed consensus algorithms while I was still trying to configure my local development path. The dread in my chest was real.</p>
      <p>Four years later, I know that everyone experiences imposter syndrome. Growth is not measured against someone else's highlight reel; it is measured against where you started yesterday.</p>
    `,
    category: 'Personal Experiences',
    categorySlug: 'personal-experiences',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    author: mockAuthors[3],
    publishedAt: '2026-11-02',
    readTime: '5 min read',
    views: 3120,
    likes: 290,
    isFeatured: false,
    isEditorsPick: false,
    status: 'published'
  },
  {
    id: 'art-8',
    title: 'Review: Top 5 Sci-Fi Films to Watch Before Your Artificial Intelligence Midterms',
    slug: 'top-sci-fi-films-ai-midterm',
    excerpt: 'Take a break from gradient descent and neural network loss functions with these thought-provoking cinematic examinations of consciousness, ethics, and future tech.',
    content: `
      <p>Studying AI without pondering philosophical ethics is like building an airplane without wings. Here are 5 modern sci-fi classics that every aspiring engineer should watch.</p>
    `,
    category: 'Entertainment',
    categorySlug: 'entertainment',
    coverImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
    author: mockAuthors[2],
    publishedAt: '2026-10-28',
    readTime: '4 min read',
    views: 1450,
    likes: 92,
    isFeatured: false,
    isEditorsPick: false,
    status: 'published'
  }
];

export const mockComments = [
  {
    id: 'comm-1',
    articleId: 'art-1',
    author: {
      name: 'Sneha Patel',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
    },
    content: 'This is exactly the reality check I needed as a 1st-year student. I was so caught up trying to learn 5 frameworks at once. Going to double down on C++ and Data Structures now!',
    createdAt: '2 days ago',
    likes: 14
  },
  {
    id: 'comm-2',
    articleId: 'art-1',
    author: {
      name: 'Devansh Kulkarni',
      role: 'Alumni',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'
    },
    content: 'Spot on about campus clubs. The projects I shipped with my college coding club were the only things my interviewers asked about during placements.',
    createdAt: '1 day ago',
    likes: 9
  },
  {
    id: 'comm-3',
    articleId: 'art-3',
    author: {
      name: 'Karan Mehra',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'
    },
    content: 'Thank you Ananya for breaking this down so methodically! Can you share more about the system design expectations for freshers?',
    createdAt: '3 days ago',
    likes: 12
  }
];

export const mockStudentSubmissions = [
  {
    id: 'sub-1',
    title: 'Building a Real-Time Campus Shuttle Tracker with WebSockets',
    category: 'Technology',
    status: 'pending',
    submittedAt: '2026-11-20',
    views: 0,
    commentsCount: 0,
    rejectionReason: null
  },
  {
    id: 'sub-2',
    title: 'Navigating Your First Semester in Tech: Lessons from a Final-Year Senior',
    category: 'Academics',
    status: 'published',
    submittedAt: '2026-11-16',
    views: 1420,
    commentsCount: 2,
    rejectionReason: null
  },
  {
    id: 'sub-3',
    title: 'Understanding Docker Containers for College Project Deployments',
    category: 'Programming',
    status: 'draft',
    submittedAt: '2026-11-19',
    views: 0,
    commentsCount: 0,
    rejectionReason: null
  },
  {
    id: 'sub-4',
    title: 'Why We Should Ban 8 AM Lectures Forever',
    category: 'Campus Life',
    status: 'rejected',
    submittedAt: '2026-11-14',
    views: 0,
    commentsCount: 0,
    rejectionReason: 'The piece reads more like an emotional venting post rather than an analytical campus opinion article. Please add student survey data or faculty perspectives to substantiate your arguments.'
  }
];

export const mockEditorQueue = [
  {
    id: 'queue-1',
    title: 'Building a Real-Time Campus Shuttle Tracker with WebSockets',
    author: {
      name: 'Vikram Joshi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      department: 'ECE, Year 3'
    },
    category: 'Technology',
    submittedAt: 'Nov 20, 2026 (Yesterday)',
    wordCount: 850,
    readTime: '4 min',
    excerpt: 'How our student team connected GPS dongles on the campus transit fleet to a Node.js microservice delivering real-time map updates to 4,000 commuters.',
    content: '<p>Campus bus schedules are notorious for delays during monsoon peak hours. Last semester, we decided to solve this natively using ESP32 chips, MQTT brokers, and a responsive Leaflet web client.</p>'
  },
  {
    id: 'queue-2',
    title: 'Demystifying the Summer Research Fellowship at National Labs',
    author: {
      name: 'Ritu Sen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      department: 'Physics, Year 4'
    },
    category: 'Academics',
    submittedAt: 'Nov 19, 2026',
    wordCount: 1120,
    readTime: '6 min',
    excerpt: 'A comprehensive step-by-step application strategy for securing funded undergraduate summer research positions at premier government institutes.',
    content: '<p>Many students assume undergraduate research fellowships require having published papers beforehand. In reality, professors look for crisp statement-of-purpose clarity and genuine curiosity.</p>'
  },
  {
    id: 'queue-3',
    title: 'The Evolution of the Campus Music Society: From Acoustic Jams to Studio Albums',
    author: {
      name: 'Tanmay Bhattacharya',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80',
      department: 'Civil Eng, Year 2'
    },
    category: 'Entertainment',
    submittedAt: 'Nov 18, 2026',
    wordCount: 720,
    readTime: '3 min',
    excerpt: 'Tracing 15 years of student band performances, late-night amphitheater rehearsals, and how our society finally produced its first original Spotify record.',
    content: '<p>There is a special resonance in the campus amphitheater after 10 PM when the echo of guitar distortion bounces off the quadrangle walls.</p>'
  }
];

export const mockUsersList = [
  {
    id: 'u-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    role: 'Student',
    department: 'CSE (2023-2027)',
    articlesCount: 5,
    joinedDate: 'Aug 2024',
    status: 'Active'
  },
  {
    id: 'u-2',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@campus.edu',
    role: 'Editor',
    department: 'IT (2022-2026)',
    articlesCount: 12,
    joinedDate: 'Jan 2024',
    status: 'Active'
  },
  {
    id: 'u-3',
    name: 'Prof. Ramesh Gupta',
    email: 'r.gupta@campus.edu',
    role: 'Admin',
    department: 'Faculty Advisor, CSE',
    articlesCount: 4,
    joinedDate: 'Aug 2023',
    status: 'Active'
  },
  {
    id: 'u-4',
    name: 'Priya Nambiar',
    email: 'priya.n@campus.edu',
    role: 'Editor',
    department: 'EE (2022-2026)',
    articlesCount: 8,
    joinedDate: 'Mar 2024',
    status: 'Active'
  },
  {
    id: 'u-5',
    name: 'Karan Mehra',
    email: 'karan.m@campus.edu',
    role: 'Student',
    department: 'Mechanical (2024-2028)',
    articlesCount: 2,
    joinedDate: 'Oct 2025',
    status: 'Active'
  }
];
