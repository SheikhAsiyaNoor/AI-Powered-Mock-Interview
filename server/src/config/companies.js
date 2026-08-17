const COMPANIES = [
    {
        id: "google",
        name: "Google",
        category: "Big Tech / FAANG",
        logo: "🌐",
        brandColor: "#4285F4",
        hiringCutoff: 85,
        difficultyLevel: "Hard",
        tagline: "Algorithmic depth, scalable systems & Googliness",
        description: "Google's interview process tests deep algorithmic problem solving, time/space complexity optimization, scalable system architectures, and cultural alignment ('Googliness').",
        focusAreas: [
            "Data Structures & Algorithms (O(N) time/space optimization)",
            "Distributed Systems & Scalability",
            "Concurrency & Multi-threading",
            "Googliness (Intellectual humility, collaboration, ambiguity handling)"
        ],
        availableRounds: [
            { id: "technical", label: "Algorithmic & Coding Round", desc: "Rigorous algorithmic problem solving and complexity analysis" },
            { id: "system_design", label: "Large-Scale System Design", desc: "Designing distributed, fault-tolerant infrastructure" },
            { id: "googliness", label: "Googliness & Leadership", desc: "Behavioral questions testing teamwork, ethics, and innovation" }
        ],
        systemPromptGuideline: `
You are a Staff Software Engineer and Hiring Committee Member at Google conducting a technical interview.
EVALUATION STANDARDS:
- Emphasize mathematical and algorithmic rigor: candidate MUST specify Time and Space complexity (Big-O notation).
- Look for edge case handling (e.g. integer overflow, large inputs, race conditions).
- For behavioral rounds, assess 'Googliness': intellectual humility, doing the right thing, navigating ambiguity, and proactive teamwork.
- If an answer lacks depth or complexity analysis, push for optimization.
        `.trim()
    },
    {
        id: "amazon",
        name: "Amazon",
        category: "Big Tech / FAANG",
        logo: "📦",
        brandColor: "#FF9900",
        hiringCutoff: 82,
        difficultyLevel: "Hard",
        tagline: "16 Leadership Principles, high-scale services & customer obsession",
        description: "Amazon's interviews blend technical execution with the 16 Leadership Principles. Every answer is evaluated on customer impact, ownership, and deliverable results.",
        focusAreas: [
            "16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep, Deliver Results)",
            "Object-Oriented Design & Microservices",
            "High-Availability Cloud Architectures (AWS principles)",
            "STAR Method Structured Responses"
        ],
        availableRounds: [
            { id: "technical", label: "Technical Problem Solving & OOD", desc: "Data structures, clean code, and object-oriented design" },
            { id: "system_design", label: "Cloud & Microservices Architecture", desc: "Designing decoupled, scalable cloud systems" },
            { id: "bar_raiser", label: "Bar Raiser / Leadership Principles", desc: "Deep dive into behavioral situations evaluating Amazon Leadership Principles" }
        ],
        systemPromptGuideline: `
You are a Senior Bar Raiser and Technical Leader at Amazon conducting an interview.
EVALUATION STANDARDS:
- Strongly evaluate against Amazon's 16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep, Invent & Simplify, Deliver Results).
- Require structured answers using the STAR method (Situation, Task, Action, Result).
- Ask candidates how their technical choices benefit the end-customer and how they manage trade-offs.
        `.trim()
    },
    {
        id: "microsoft",
        name: "Microsoft",
        category: "Big Tech / FAANG",
        logo: "🪟",
        brandColor: "#00A4EF",
        hiringCutoff: 80,
        difficultyLevel: "Medium-Hard",
        tagline: "Clean engineering, modular design & collaborative problem solving",
        description: "Microsoft focuses on clean, maintainable software engineering, robust object-oriented architecture, edge case verification, and clear collaborative communication.",
        focusAreas: [
            "Clean Code & Object-Oriented Principles (SOLID, Design Patterns)",
            "Data Structures, Trees, Graphs & Recursion",
            "System Architecture & API Design",
            "Growth Mindset & Team Collaboration"
        ],
        availableRounds: [
            { id: "technical", label: "Core Coding & Data Structures", desc: "Clean coding, recursion, trees, and dynamic programming" },
            { id: "system_design", label: "Enterprise Software Architecture", desc: "Modular architecture, API contracts, and database schema design" },
            { id: "culture", label: "Growth Mindset & Culture", desc: "Learning from failures, cross-functional collaboration, and technical leadership" }
        ],
        systemPromptGuideline: `
You are a Principal Software Engineering Manager at Microsoft.
EVALUATION STANDARDS:
- Look for clean, maintainable, modular code structure adhering to SOLID design principles.
- Check if the candidate considers unit testing, defensive coding, and maintainability.
- Evaluate growth mindset: how the candidate approaches learning, handling mistakes, and team collaboration.
        `.trim()
    },
    {
        id: "tcs",
        name: "TCS",
        category: "Service IT Giants",
        logo: "🏢",
        brandColor: "#0078D7",
        hiringCutoff: 65,
        difficultyLevel: "Medium",
        tagline: "Core CS fundamentals, SQL depth & technical aptitude",
        description: "Tata Consultancy Services (TCS) tests candidates on strong core computer science fundamentals, OOP concepts, SQL queries, database indexing, and professional communication.",
        focusAreas: [
            "Core CS Fundamentals (OOP, DBMS, Operating Systems, Computer Networks)",
            "SQL Queries, Joins, Indexing & Normalization",
            "Basic Coding (Arrays, Strings, Searching & Sorting)",
            "Professional Communication & Project Walkthrough"
        ],
        availableRounds: [
            { id: "technical", label: "Technical Round (Core CS & SQL)", desc: "OOP, DBMS concepts, SQL queries, and basic coding" },
            { id: "managerial", label: "Managerial & Project Round", desc: "Discussion on college/internship projects and technical problem solving" },
            { id: "hr", label: "HR & Communication Round", desc: "Adaptability, willingness to relocate, and corporate etiquette" }
        ],
        systemPromptGuideline: `
You are a Technical Interviewer and Delivery Manager at Tata Consultancy Services (TCS).
EVALUATION STANDARDS:
- Focus on strong computer science fundamentals: OOP concepts (Polymorphism, Inheritance, Encapsulation, Abstraction), DBMS (ACID, Normalization, Joins), OS (Threads, Processes), and Computer Networks (TCP/IP, HTTP).
- Ask candidates to explain their academic/portfolio projects in structured detail.
- Evaluate verbal clarity, confidence, and professional readiness.
        `.trim()
    },
    {
        id: "infosys",
        name: "Infosys",
        category: "Service IT Giants",
        logo: "🔷",
        brandColor: "#007CC3",
        hiringCutoff: 65,
        difficultyLevel: "Medium",
        tagline: "Programming logic, database queries & corporate communication",
        description: "Infosys evaluates foundational programming logic, problem decomposition, database manipulation, and scenario-based communication.",
        focusAreas: [
            "Programming Logic & Syntax (Java, Python, C++, or JavaScript)",
            "Database Design & Complex SQL Queries",
            "SDLC, Agile Methodology & Quality Assurance",
            "Communication & Problem Decomposition"
        ],
        availableRounds: [
            { id: "technical", label: "Technical Programming & Database", desc: "Code logic, SQL queries, and data structures" },
            { id: "hr_managerial", label: "HR & Managerial Discussion", desc: "Communication skills, teamwork scenarios, and career goals" }
        ],
        systemPromptGuideline: `
You are a Lead Consultant at Infosys conducting a campus/entry recruitment interview.
EVALUATION STANDARDS:
- Check foundational coding logic, syntax accuracy, and step-by-step problem breakdown.
- Test database concepts: complex SQL queries, foreign keys, transactions, and indexing.
- Assess clear communication and client-facing professionalism.
        `.trim()
    },
    {
        id: "startup",
        name: "High-Growth Startup (e.g. Razorpay / Zepto)",
        category: "Startups & Unicorns",
        logo: "🚀",
        brandColor: "#10B981",
        hiringCutoff: 75,
        difficultyLevel: "Medium-Hard",
        tagline: "Pragmatic problem solving, full-stack agility & rapid execution",
        description: "Fast-paced startups evaluate real-world product building skills, API design, rapid debugging, tech stack mastery, and ability to thrive in ambiguity.",
        focusAreas: [
            "Practical Full-Stack Problem Solving & Live Debugging",
            "REST / GraphQL API Design & Schema Validation",
            "Database Query Optimization & Caching (Redis)",
            "Execution Speed, Product Intuition & Agility"
        ],
        availableRounds: [
            { id: "machine_coding", label: "Practical Machine Coding & APIs", desc: "Hands-on feature implementation, schema design, and error handling" },
            { id: "system_design", label: "Pragmatic Architecture & Caching", desc: "Designing fast, responsive services with Redis and message queues" },
            { id: "founder_culture", label: "Founder / Culture Round", desc: "Ownership, speed vs quality trade-offs, and product intuition" }
        ],
        systemPromptGuideline: `
You are a Founding Engineer / VP of Engineering at a fast-growing tech startup.
EVALUATION STANDARDS:
- Value practical problem solving over rote theoretical memorization. Ask how they would actually build and ship a feature today.
- Inquire about handling production bugs, schema changes, caching (Redis), and third-party API failures.
- Evaluate candidate's bias for action, speed of execution, and product-mindedness.
        `.trim()
    },
    {
        id: "goldman_sachs",
        name: "Goldman Sachs",
        category: "FinTech & Banking",
        logo: "🏦",
        brandColor: "#7096D1",
        hiringCutoff: 82,
        difficultyLevel: "Hard",
        tagline: "Low-latency systems, mathematical rigor & transactional integrity",
        description: "Goldman Sachs interviews demand strong mathematical reasoning, robust data structures, multithreading, ACID transactional integrity, and low-latency considerations.",
        focusAreas: [
            "Advanced Data Structures & Dynamic Programming",
            "Multithreading, Concurrency & Thread Safety",
            "Database Transactions, ACID Guarantees & Consistency",
            "Mathematical Problem Solving & Probability"
        ],
        availableRounds: [
            { id: "technical", label: "Advanced Algorithms & Concurrency", desc: "Dynamic programming, graph algorithms, and multithreading" },
            { id: "systems_data", label: "Low-Latency & Financial Systems", desc: "Transaction atomicity, low-latency queues, and data consistency" },
            { id: "behavioral", label: "Professional Judgment & Risk Awareness", desc: "Ethical decision-making, handling high-stakes systems, and risk management" }
        ],
        systemPromptGuideline: `
You are a Vice President in Global Technology at Goldman Sachs.
EVALUATION STANDARDS:
- Emphasize precision, correctness, and race-condition awareness in multithreaded systems.
- Require thorough analysis of transactional integrity (ACID) and data consistency under failure scenarios.
- Evaluate analytical mindset, attention to detail, and risk mitigation.
        `.trim()
    }
];

module.exports = COMPANIES;
