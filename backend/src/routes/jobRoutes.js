const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

const PREDEFINED_SKILLS = [
  // Programming Languages
  { name: 'Python', regex: /\bpython\b/i },
  { name: 'Java', regex: /\bjava\b/i },
  { name: 'JavaScript', regex: /\bjavascript\b|\bjs\b/i },
  { name: 'TypeScript', regex: /\btypescript\b|\bts\b/i },
  { name: 'C++', regex: /\bc\+\+\b/i },
  { name: 'C#', regex: /\bc#\b|\bc\s*sharp\b/i },
  { name: 'Go', regex: /\bgo\b|\bgolang\b/i },
  { name: 'Rust', regex: /\brust\b/i },
  { name: 'PHP', regex: /\bphp\b/i },
  { name: 'Ruby', regex: /\bruby\b/i },
  { name: 'Kotlin', regex: /\bkotlin\b/i },
  { name: 'Swift', regex: /\bswift\b/i },
  { name: 'Scala', regex: /\bscala\b/i },
  { name: 'Dart', regex: /\bdart\b/i },
  { name: 'SQL', regex: /\bsql\b/i },
  { name: 'HTML', regex: /\bhtml(5)?\b/i },
  { name: 'CSS', regex: /\bcss(3)?\b/i },
  { name: 'Bash', regex: /\bbash\b|\bshell\s+script/i },

  // Frontend
  { name: 'React', regex: /\breact(\.js|js)?\b/i },
  { name: 'Next.js', regex: /\bnext(\.js|js)?\b/i },
  { name: 'Vue.js', regex: /\bvue(\.js|js)?\b/i },
  { name: 'Angular', regex: /\bangular(\.js|js)?\b/i },
  { name: 'Svelte', regex: /\bsvelte\b/i },
  { name: 'Redux', regex: /\bredux\b/i },
  { name: 'Tailwind CSS', regex: /\btailwind(\s*css)?\b/i },
  { name: 'Bootstrap', regex: /\bbootstrap\b/i },
  { name: 'Vite', regex: /\bvite(\.js|js)?\b/i },

  // Backend
  { name: 'Node.js', regex: /\bnode(\.js|js)?\b/i },
  { name: 'Express.js', regex: /\bexpress(\.js|js)?\b/i },
  { name: 'Django', regex: /\bdjango\b/i },
  { name: 'Flask', regex: /\bflask\b/i },
  { name: 'FastAPI', regex: /\bfastapi\b/i },
  { name: 'Spring Boot', regex: /\bspring\s*boot\b|\bspring\s+framework\b/i },
  { name: 'ASP.NET', regex: /\basp\.net\b|\b\.net(\s*core)?\b/i },
  { name: 'GraphQL', regex: /\bgraphql\b/i },
  { name: 'REST API', regex: /\brest(ful)?(\s*apis?)?\b/i },
  { name: 'Microservices', regex: /\bmicroservices?\b/i },

  // Databases
  { name: 'MongoDB', regex: /\bmongo(db)?\b/i },
  { name: 'PostgreSQL', regex: /\bpostgres(ql)?\b/i },
  { name: 'MySQL', regex: /\bmysql\b/i },
  { name: 'Redis', regex: /\bredis\b/i },
  { name: 'Elasticsearch', regex: /\belasticsearch\b/i },
  { name: 'DynamoDB', regex: /\bdynamodb\b/i },
  { name: 'Firebase', regex: /\bfirebase\b/i },
  { name: 'Snowflake', regex: /\bsnowflake\b/i },
  { name: 'BigQuery', regex: /\bbigquery\b/i },

  // Cloud & DevOps
  { name: 'AWS', regex: /\baws\b|\bamazon\s+web\s+services\b/i },
  { name: 'Azure', regex: /\bazure\b|\bmicrosoft\s+azure\b/i },
  { name: 'GCP', regex: /\bgcp\b|\bgoogle\s+cloud/i },
  { name: 'Docker', regex: /\bdocker\b/i },
  { name: 'Kubernetes', regex: /\bkubernetes\b|\bk8s\b/i },
  { name: 'Terraform', regex: /\bterraform\b/i },
  { name: 'Ansible', regex: /\bansible\b/i },
  { name: 'Jenkins', regex: /\bjenkins\b/i },
  { name: 'CI/CD', regex: /\bci[\/\-]cd\b|\bcontinuous\s+integration\b/i },
  { name: 'Linux', regex: /\blinux\b/i },

  // AI, ML & Data Science
  { name: 'Machine Learning', regex: /\bmachine\s+learning\b|\bml\b/i },
  { name: 'Deep Learning', regex: /\bdeep\s+learning\b|\bdl\b/i },
  { name: 'Artificial Intelligence', regex: /\bartificial\s+intelligence\b|\bai\b/i },
  { name: 'NLP', regex: /\bnatural\s+language\s+processing\b|\bnlp\b/i },
  { name: 'Computer Vision', regex: /\bcomputer\s+vision\b|\bcv\b/i },
  { name: 'TensorFlow', regex: /\btensorflow\b/i },
  { name: 'PyTorch', regex: /\bpytorch\b/i },
  { name: 'Scikit-learn', regex: /\bscikit-learn\b|\bsklearn\b/i },
  { name: 'Pandas', regex: /\bpandas\b/i },
  { name: 'NumPy', regex: /\bnumpy\b/i },
  { name: 'Tableau', regex: /\btableau\b/i },
  { name: 'Power BI', regex: /\bpower\s*bi\b/i },
  { name: 'Apache Spark', regex: /\b(apache\s+)?spark\b|\bpyspark\b/i },
  { name: 'Apache Kafka', regex: /\b(apache\s+)?kafka\b/i },
  { name: 'LLMs', regex: /\bllms?\b|\blarge\s+language\s+models?\b/i },
  { name: 'LangChain', regex: /\blangchain\b/i },
  { name: 'Data Analytics', regex: /\bdata\s+analytics?\b|\bdata\s+analysis\b/i },

  // Mobile
  { name: 'Flutter', regex: /\bflutter\b/i },
  { name: 'React Native', regex: /\breact\s+native\b/i },
  { name: 'Android', regex: /\bandroid\b/i },
  { name: 'iOS', regex: /\bios\b/i },

  // Testing & Tools
  { name: 'Git', regex: /\bgit\b/i },
  { name: 'Jira', regex: /\bjira\b/i },
  { name: 'Agile', regex: /\bagile\b/i },
  { name: 'Scrum', regex: /\bscrum\b/i },
  { name: 'Postman', regex: /\bpostman\b/i },
  { name: 'Figma', regex: /\bfigma\b/i }
];

const extractSkills = (text) => {
  const foundSkills = [];
  PREDEFINED_SKILLS.forEach((skill) => {
    if (skill.regex.test(text)) {
      foundSkills.push(skill.name);
    }
  });
  return foundSkills.sort();
};

// @route   POST /api/jobs
// @desc    Create a new job description with dynamic custom required skills support
router.post('/', async (req, res) => {
  const { title, description, requiredSkills: explicitSkills } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ error: 'Please provide both job title and description.' });
  }

  try {
    let requiredSkills = [];
    if (Array.isArray(explicitSkills) && explicitSkills.length > 0) {
      requiredSkills = [...new Set(explicitSkills.map(s => String(s).trim()).filter(Boolean))].sort();
    } else if (typeof explicitSkills === 'string' && explicitSkills.trim()) {
      requiredSkills = [...new Set(explicitSkills.split(',').map(s => s.trim()).filter(Boolean))].sort();
    } else {
      requiredSkills = extractSkills(description);
    }

    const job = new Job({
      title,
      description,
      requiredSkills
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// @route   GET /api/jobs
// @desc    Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get a single job description
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job description not found.' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
