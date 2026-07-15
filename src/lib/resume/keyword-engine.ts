export const ROLE_KEYWORDS: Record<string, string[]> = {
  "frontend-engineer": [
    "React", "Next.js", "TypeScript", "JavaScript", "HTML", "CSS",
    "REST API", "Responsive Design", "Jest", "Webpack", "Redux",
    "Tailwind CSS", "SPA", "Component Architecture", "Performance Optimization",
  ],
  "backend-engineer": [
    "Node.js", "Express", "REST API", "Microservices", "Redis",
    "PostgreSQL", "MongoDB", "Docker", "AWS", "Authentication",
    "Caching", "CI/CD", "API Design", "Database Design", "JWT",
  ],
  "full-stack": [
    "React", "Node.js", "Next.js", "TypeScript", "JavaScript",
    "Docker", "AWS", "PostgreSQL", "MongoDB", "Git",
    "REST API", "GraphQL", "Testing", "CI/CD", "Tailwind CSS",
  ],
  "ai-engineer": [
    "Python", "TensorFlow", "PyTorch", "LLM", "LangChain",
    "Vector Database", "RAG", "Prompt Engineering", "Fine Tuning",
    "OpenAI API", "FastAPI", "Hugging Face", "Machine Learning",
    "Deep Learning", "NLP", "Data Pipeline",
  ],
  "data-engineer": [
    "Python", "SQL", "ETL", "Apache Spark", "Kafka",
    "Airflow", "Snowflake", "BigQuery", "AWS", "Data Warehouse",
    "Data Pipeline", "PostgreSQL", "MongoDB", "Docker",
  ],
  "cybersecurity": [
    "Network Security", "SIEM", "SOC", "Splunk", "Kali Linux",
    "Incident Response", "Penetration Testing", "OWASP Top 10",
    "Vulnerability Assessment", "Security Audit", "Firewall",
    "Encryption", "Identity Access Management",
  ],
  "cloud-engineer": [
    "AWS", "Azure", "Google Cloud", "Terraform", "Kubernetes",
    "Docker", "CI/CD", "Linux", "Monitoring", "Infrastructure as Code",
    "Cloud Architecture", "DevOps", "Automation",
  ],
}

export const TECH_EXPANSIONS: Record<string, string[]> = {
  react: ["React", "JavaScript (ES6+)", "React Hooks", "SPA Architecture", "Component-Based Design", "Responsive UI"],
  nextjs: ["Next.js", "Server-Side Rendering", "Static Site Generation", "API Routes", "React", "Full-Stack Framework"],
  typescript: ["TypeScript", "Static Typing", "Generics", "Type Safety", "Interface Design"],
  javascript: ["JavaScript (ES6+)", "Async/Await", "Promises", "DOM Manipulation", "Closures", "Event Loop"],
  node: ["Node.js", "REST API Design", "Express", "Middleware", "JWT Authentication", "Async Patterns"],
  express: ["Express.js", "RESTful API", "Middleware Architecture", "Route Design", "Error Handling"],
  python: ["Python", "Scripting", "Automation", "Data Processing", "OOP"],
  postgresql: ["PostgreSQL", "Relational Database Design", "SQL", "Query Optimization", "Indexing", "Migrations"],
  mongodb: ["MongoDB", "NoSQL", "Document Database", "Aggregation Pipeline", "Schema Design"],
  docker: ["Docker", "Containerization", "Image Management", "Multi-Stage Builds", "Docker Compose"],
  aws: ["AWS", "Cloud Infrastructure", "EC2", "S3", "Lambda", "Cloud Architecture", "Auto Scaling"],
  git: ["Git", "Version Control", "Branching Strategy", "Code Review", "Collaborative Development"],
  redis: ["Redis", "Caching", "In-Memory Data Store", "Session Management", "Pub/Sub"],
  graphql: ["GraphQL", "Schema Design", "Queries & Mutations", "Apollo", "Data Fetching"],
  jest: ["Jest", "Unit Testing", "Integration Testing", "Test Coverage", "Mocking"],
  tailwind: ["Tailwind CSS", "Utility-First CSS", "Responsive Design", "CSS Architecture"],
  redux: ["Redux", "State Management", "Actions & Reducers", "Middleware", "Immutability"],
  kubernetes: ["Kubernetes", "Container Orchestration", "Pod Management", "Scaling", "Deployment"],
  terraform: ["Terraform", "Infrastructure as Code", "Cloud Provisioning", "State Management"],
  fastapi: ["FastAPI", "Python REST API", "Async Python", "OpenAPI", "Type Validation"],
  tensorflow: ["TensorFlow", "Deep Learning", "Neural Networks", "Model Training", "ML Pipeline"],
  pytorch: ["PyTorch", "Deep Learning", "Neural Networks", "GPU Computing", "Autograd"],
}

const CATEGORY_MAP: Record<string, string> = {
  javascript: "Languages",
  typescript: "Languages",
  python: "Languages",
  java: "Languages",
  go: "Languages",
  rust: "Languages",
  cpp: "Languages",
  c: "Languages",
  swift: "Languages",
  kotlin: "Languages",
  ruby: "Languages",
  php: "Languages",
  react: "Frameworks & Libraries",
  nextjs: "Frameworks & Libraries",
  vue: "Frameworks & Libraries",
  angular: "Frameworks & Libraries",
  node: "Frameworks & Libraries",
  express: "Frameworks & Libraries",
  fastapi: "Frameworks & Libraries",
  tensorflow: "Frameworks & Libraries",
  pytorch: "Frameworks & Libraries",
  redux: "Frameworks & Libraries",
  jest: "Testing",
  cypress: "Testing",
  pytest: "Testing",
  postgresql: "Databases & Storage",
  mongodb: "Databases & Storage",
  redis: "Databases & Storage",
  sql: "Databases & Storage",
  snowflake: "Databases & Storage",
  bigquery: "Databases & Storage",
  docker: "Cloud & Infrastructure",
  aws: "Cloud & Infrastructure",
  azure: "Cloud & Infrastructure",
  gcp: "Cloud & Infrastructure",
  kubernetes: "Cloud & Infrastructure",
  terraform: "Cloud & Infrastructure",
  linux: "Cloud & Infrastructure",
  git: "Tools & Editors",
  webpack: "Tools & Editors",
  vite: "Tools & Editors",
  tailwind: "Frameworks & Libraries",
  graphql: "Frameworks & Libraries",
}

export function getDefaultCategory(techName: string): string {
  return CATEGORY_MAP[techName.toLowerCase()] || "Other"
}

export function getKeywordsForRole(role: string): string[] {
  return ROLE_KEYWORDS[role] || []
}

export function expandTech(name: string): string[] {
  return TECH_EXPANSIONS[name.toLowerCase()] || [name]
}
