// js/products.js — Code Hunters product catalog
// folderEnv: the process.env key whose value is the Google Drive folder ID for this product.
// Legacy products share the single global GDRIVE_FOLDER_ID folder (fallback).
// New bundle products each resolve to their own dedicated folder.
var PRODUCTS = [
  {
    id: 'developers-kit',
    title: "Developer's Kit – 700+ Projects Bundle",
    price: 369, origPrice: 1999,
    type: 'bundle', badge: 'bestseller', badgeLabel: 'Bestseller',
    stars: 5, reviewCount: 412,
    image: '/images/Developers-Kit-1943x2048-1-972x1024.png',
    cat: 'bundles',
    folderEnv: 'GDRIVE_FOLDER_ID',
    desc: '700+ real-world projects across 10+ technologies',
    longDesc: 'Turn your resume into a shortlist magnet with 700+ real-world coding projects. Includes source code for Python, React, JavaScript, Data Science, and more. Master interview-ready projects today.',
    features: ['700+ real-world projects', 'Python, React, Java, JS & more', 'Lifetime access & updates', 'Source code for every project', 'Priority community support']
  },
  {
    id: '30-day-data-analyst-kit',
    title: '30-Day Data Analyst Kit',
    price: 299, origPrice: 799,
    type: 'product', badge: 'hot', badgeLabel: 'Hot Deal',
    stars: 5, reviewCount: 187,
    image: '/images/100-Natural-Language-Processing-918x1024.png',
    cat: 'data',
    folderEnv: 'GDRIVE_FOLDER_ID',
    desc: 'Complete data analyst prep – 30-day structured plan',
    longDesc: 'A complete, structured 30-day roadmap to master Data Analysis. Includes SQL, Python, Tableau, and real-world datasets for your portfolio.',
    features: ['30-Day Structured Roadmap', 'Real-world Datasets', 'SQL & Python exercises', 'Tableau Dashboards', 'Interview cheat sheets']
  },
  {
    id: '5-day-js-bootcamp',
    title: '5-Day JavaScript Bootcamp',
    price: 201, origPrice: 599,
    type: 'product', badge: 'new', badgeLabel: 'New',
    stars: 4, reviewCount: 94,
    image: '/images/react-915x1024.png',
    cat: 'web',
    folderEnv: 'GDRIVE_FOLDER_ID',
    desc: 'Intensive 5-day JavaScript for everything bootcamp',
    longDesc: 'Master JavaScript from scratch in 5 days. Build 10 real projects including a weather app, calculator, and to-do list. Perfect for beginners.',
    features: ['5 Days of intensive lessons', '10 Real-world projects', 'Modern ES6+ Syntax', 'DOM Manipulation Mastery', 'Certificate of Completion']
  },
  {
    id: 'interview-mastery',
    title: 'Interview Mastery System',
    price: 1499, origPrice: 3999,
    type: 'product', badge: 'premium', badgeLabel: 'Premium',
    stars: 5, reviewCount: 231,
    image: '/images/softare-919x1024.png',
    cat: 'career',
    folderEnv: 'GDRIVE_FOLDER_ID',
    desc: 'Clear every interview round – HR & Technical prep',
    longDesc: 'The ultimate guide to passing tech interviews. Covers behavioral questions, technical screening, system design, and salary negotiation.',
    features: ['Behavioral Q&A templates', 'System Design crash course', 'Data Structures & Algorithms', 'Mock Interview recordings', 'Salary Negotiation scripts']
  },
  {
    id: 'interview-cracking-2026',
    title: 'Interview-Cracking System 2026',
    price: 399, origPrice: 999,
    type: 'product', badge: 'new', badgeLabel: 'New',
    stars: 4, reviewCount: 68,
    image: '/images/100-Programming-Tools-927x1024.jpg',
    cat: 'career',
    folderEnv: 'GDRIVE_FOLDER_ID',
    desc: 'AI-powered interview cracking system for 2026',
    longDesc: 'Leverage AI tools to prepare for interviews. Learn how to use ChatGPT and Copilot to practice coding rounds and generate customized resumes.',
    features: ['AI Prompt Engineering for Devs', 'Automated Resume Tailoring', 'Mock AI Interviews', 'Latest 2026 Tech Trends', 'Tools & extensions list']
  },
  {
    id: 'ats-resume-template',
    title: 'ATS Resume Template – WebDev',
    price: 129, origPrice: 499,
    type: 'product', badge: '', badgeLabel: '',
    stars: 4, reviewCount: 155,
    image: '/images/100-Editable-Resume-Templates-922x1024.jpg',
    cat: 'career',
    folderEnv: 'GDRIVE_FOLDER_ID',
    desc: 'ATS-approved resume template for web developers',
    longDesc: 'A proven, ATS-friendly resume template tailored specifically for web developers. Includes examples of bullet points for various projects.',
    features: ['ATS-Optimized format', 'Web Dev specific phrasing', 'Cover Letter template included', 'Figma & Word formats', 'Lifetime updates']
  },
  {
    id: 'vip-pass',
    title: 'Upgrade to VIP Pass',
    price: 149, origPrice: 499,
    type: 'product', badge: 'exclusive', badgeLabel: 'Exclusive',
    stars: 5, reviewCount: 43,
    image: null,
    cat: 'bundles',
    folderEnv: 'GDRIVE_FOLDER_ID',
    desc: 'VIP pass with exclusive benefits & early access',
    longDesc: 'Get priority 1-on-1 support, early access to new kits, and exclusive live webinars with industry experts.',
    features: ['Priority 1-on-1 Support', 'Early access to new products', 'Exclusive Live Webinars', 'Private Discord Channel', 'Code Review sessions']
  },
  {
    id: 'Testing-First',
    title: 'Testing First – QA Starter Kit',
    price: 12, origPrice: 99,
    type: 'product', badge: '', badgeLabel: '',
    stars: 3, reviewCount: 21,
    image: '/images/100-VS-Code-Keyboard-Shortcuts-927x1024.jpg',
    cat: 'web',
    folderEnv: 'GDRIVE_FOLDER_ID',
    desc: 'Complete testing starter – unit, integration, e2e',
    longDesc: 'Learn the fundamentals of testing. Covers Unit testing with Jest, Integration testing, and E2E testing with Cypress.',
    features: ['Jest & React Testing Library', 'Cypress E2E basics', 'Mocking & Stubbing', 'CI/CD pipeline setup', 'Test-Driven Development (TDD)']
  },

  // ── New bundle products — each resolves to its own dedicated Google Drive folder ──
  {
    id: 'ai_bundle',
    title: 'AI Engineer Bundle',
    price: 499, origPrice: 1499,
    type: 'bundle', badge: 'new', badgeLabel: 'New',
    stars: 5, reviewCount: 12,
    // Hero: ML cover. Previews: NLP (x2) + software engineering
    image: '/images/150-Machine-Learnig-1-919x1024.png',
    previewImages: [
      '/images/100-Natural-Language-Processing-918x1024.png',
      '/images/50-Natural-Language-Processing-919x1024.png',
      '/images/150-Machine-Learnig-918x1024.png',
      '/images/softare-919x1024.png'
    ],
    projectCount: '150+ Projects',
    cat: 'bundles',
    folderEnv: 'GDRIVE_FOLDER_AI',
    desc: 'Complete AI & Machine Learning project bundle',
    longDesc: 'Everything you need to break into AI engineering — curated projects, notebooks, and guides across LLMs, computer vision, NLP, and MLOps.',
    features: ['LLM & Prompt Engineering projects', 'Computer Vision with PyTorch', 'NLP pipelines', 'MLOps & deployment guides', 'Lifetime access & updates']
  },
  {
    id: 'python_bundle',
    title: 'Python Bundle',
    price: 399, origPrice: 999,
    type: 'bundle', badge: 'hot', badgeLabel: 'Hot Deal',
    stars: 5, reviewCount: 34,
    // Hero: 300 Python projects cover. Previews: Django + tools + C
    image: '/images/300-Python-Projects-915x1024.png',
    previewImages: [
      '/images/Django-915x1024.png',
      '/images/100-Programming-Tools-927x1024.jpg',
      '/images/C-915x1024.png',
      '/images/Roadmap-927x1024.jpg'
    ],
    projectCount: '300+ Projects',
    cat: 'bundles',
    folderEnv: 'GDRIVE_FOLDER_PYTHON',
    desc: '100+ Python projects from beginner to advanced',
    longDesc: 'Master Python with hands-on projects spanning automation, web scraping, data analysis, and backend development.',
    features: ['100+ Python projects', 'Automation & scripting', 'Data analysis with Pandas', 'Web scraping with BeautifulSoup', 'FastAPI & Flask backends']
  },
  {
    id: 'webdev_bundle',
    title: 'Web Dev Bundle',
    price: 449, origPrice: 1199,
    type: 'bundle', badge: 'bestseller', badgeLabel: 'Bestseller',
    stars: 5, reviewCount: 89,
    // Hero: 150 frontend projects cover. Previews: React + Java + PHP
    image: '/images/150-Front-end-Projects-915x1024.png',
    previewImages: [
      '/images/react-915x1024.png',
      '/images/Java-915x1024.png',
      '/images/PHP-915x1024.png',
      '/images/100-VS-Code-Keyboard-Shortcuts-927x1024.jpg'
    ],
    projectCount: '150+ Projects',
    cat: 'web',
    folderEnv: 'GDRIVE_FOLDER_WEBDEV',
    desc: 'Full-stack web development projects & templates',
    longDesc: 'React, Node.js, HTML/CSS, and JavaScript projects you can use on your portfolio today. Built the way real companies build software.',
    features: ['React & Next.js projects', 'Node.js & Express APIs', 'Full-stack CRUD apps', 'Responsive UI templates', 'Source code included']
  },
  {
    id: 'appdev_bundle',
    title: 'App Dev Bundle',
    price: 449, origPrice: 1199,
    type: 'bundle', badge: 'new', badgeLabel: 'New',
    stars: 4, reviewCount: 7,
    // Hero: React cover. Previews: Java + frontend projects + tools
    image: '/images/react-915x1024.png',
    previewImages: [
      '/images/Java-915x1024.png',
      '/images/150-Front-end-Projects-915x1024.png',
      '/images/100-Programming-Tools-927x1024.jpg'
    ],
    projectCount: '80+ Projects',
    cat: 'bundles',
    folderEnv: 'GDRIVE_FOLDER_APPDEV',
    desc: 'Mobile & cross-platform app development projects',
    longDesc: 'Build real mobile apps with React Native, Flutter, and Android. Includes source code and step-by-step structure.',
    features: ['React Native projects', 'Flutter starter apps', 'REST API integration', 'App store ready structure', 'Lifetime access']
  },
  {
    id: 'career_bundle',
    title: 'Career Bundle',
    price: 349, origPrice: 899,
    type: 'bundle', badge: 'exclusive', badgeLabel: 'Exclusive',
    stars: 5, reviewCount: 56,
    // Hero: software engineering cover. Previews: resume + roadmap + tools
    image: '/images/softare-919x1024.png',
    previewImages: [
      '/images/100-Editable-Resume-Templates-922x1024.jpg',
      '/images/Roadmap-927x1024.jpg',
      '/images/100-Programming-Tools-927x1024.jpg',
      '/images/100-VS-Code-Keyboard-Shortcuts-927x1024.jpg'
    ],
    projectCount: '100+ Resources',
    cat: 'career',
    folderEnv: 'GDRIVE_FOLDER_CAREER',
    desc: 'Resume templates, interview prep & career tools',
    longDesc: 'The complete career toolkit — ATS resumes, interview Q&A banks, system design guides, and salary negotiation scripts.',
    features: ['ATS-optimised resume templates', 'Interview Q&A banks', 'System design crash course', 'Salary negotiation scripts', 'LinkedIn profile guide']
  },
  {
    id: 'mega_bundle',
    title: 'Mega Bundle – Everything',
    price: 999, origPrice: 4999,
    type: 'bundle', badge: 'premium', badgeLabel: 'Premium',
    stars: 5, reviewCount: 203,
    // Hero: Developer's Kit — the flagship. Previews: ML + Python + React + frontend
    image: '/images/Developers-Kit-1943x2048-1-972x1024.png',
    previewImages: [
      '/images/150-Machine-Learnig-1-919x1024.png',
      '/images/300-Python-Projects-915x1024.png',
      '/images/react-915x1024.png',
      '/images/softare-919x1024.png'
    ],
    projectCount: '700+ Projects',
    cat: 'bundles',
    folderEnv: 'GDRIVE_FOLDER_MEGA',
    desc: 'All bundles — AI, Python, Web Dev, App Dev & Career',
    longDesc: 'Get every single bundle we offer in one purchase. The complete developer arsenal for landing your dream job.',
    features: ['All AI, Python, Web & App projects', 'Complete career toolkit', 'Lifetime access & future updates', 'Priority support', '80% off vs buying individually']
  }
];
