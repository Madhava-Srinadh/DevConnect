// services/skillExtractor.js
// Simple keyword-based skill extraction (no AI/API needed)

// Comprehensive skill dictionary with variations and aliases
const DEBUG_SKILLS = true;
const SKILL_DICTIONARY = {
  // Programming Languages
  "python": ["python", "python3", "python2", "django", "flask", "fastapi"],
  "javascript": ["javascript", "js", "ecmascript", "node.js", "nodejs", "node"],
  "typescript": ["typescript", "ts"],
  "java": ["java", "spring", "spring boot", "springboot"],
  "c++": ["c++", "cpp", "cplusplus"],
  "c#": ["c#", "csharp", ".net", "dotnet", "asp.net"],
  "go": ["go", "golang"],
  "rust": ["rust"],
  "php": ["php", "laravel", "symfony"],
  "ruby": ["ruby", "rails", "ruby on rails"],
  "swift": ["swift", "ios"],
  "kotlin": ["kotlin", "android"],
  
  // Frontend Frameworks
  "react": ["react", "reactjs", "react.js", "next.js", "nextjs"],
  "angular": ["angular", "angularjs", "angular.js"],
  "vue": ["vue", "vuejs", "vue.js", "nuxt", "nuxt.js"],
  "html": ["html", "html5"],
  "css": ["css", "css3", "sass", "scss", "less", "tailwind", "bootstrap"],
  
  // Backend Frameworks
  "express": ["express", "express.js", "expressjs"],
  "django": ["django"],
  "flask": ["flask"],
  "spring": ["spring", "spring boot", "springboot"],
  "nest": ["nest", "nestjs"],
  
  // Databases
  "sql": ["sql", "mysql", "postgresql", "postgres", "sqlite", "oracle", "mssql"],
  "mongodb": ["mongodb", "mongo"],
  "nosql": ["nosql", "cassandra", "couchdb"],
  "postgresql": ["postgresql", "postgres"],
  "mysql": ["mysql"],
  "redis": ["redis"],
  
  // Cloud & DevOps
  "aws": ["aws", "amazon web services", "ec2", "s3", "lambda", "cloudformation"],
  "azure": ["azure", "microsoft azure"],
  "gcp": ["gcp", "google cloud", "google cloud platform"],
  "docker": ["docker", "dockerfile", "container"],
  "kubernetes": ["kubernetes", "k8s"],
  "terraform": ["terraform"],
  "devops": ["devops", "ci/cd", "cicd", "jenkins", "gitlab ci", "github actions"],
  "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
  
  // ML/AI
  "machine learning": ["machine learning", "ml", "scikit-learn", "sklearn"],
  "deep learning": ["deep learning", "neural network", "neural networks"],
  "tensorflow": ["tensorflow", "tf"],
  "pytorch": ["pytorch", "torch"],
  
  // Tools & Others
  "git": ["git"],
  "github": ["github"],
  "gitlab": ["gitlab"],
  "bitbucket": ["bitbucket"],
  "linux": ["linux", "ubuntu", "debian", "centos"],
  "bash": ["bash", "shell", "shell scripting"],
  "powershell": ["powershell"],
  "rest api": ["rest", "rest api", "restful", "api"],
  "graphql": ["graphql"],
  "testing": ["testing", "jest", "mocha", "jasmine", "cypress", "selenium"],
  "agile": ["agile", "scrum", "kanban"],
  "scrum": ["scrum"],
  "kanban": ["kanban"],
  "project management": ["project management", "pm", "jira", "trello"],
};

function extractSkillsFromText(text) {
  if (!text || typeof text !== "string") return [];

  const normalizedText = text.toLowerCase();
  const foundSkills = new Set();

  for (const [skill, variations] of Object.entries(SKILL_DICTIONARY)) {
    for (const v of variations) {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");

      if (regex.test(normalizedText)) {
        foundSkills.add(skill);
        if (DEBUG_SKILLS) {
        }
        break;
      }
    }
  }

  return Array.from(foundSkills);
}

module.exports = { extractSkillsFromText };
