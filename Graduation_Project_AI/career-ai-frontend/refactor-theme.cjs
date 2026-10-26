const fs = require('fs');
const path = require('path');

const targetFiles = [
  'ResumeUpload.tsx',
  'Profile.tsx',
  'CareerQuestionnaire.tsx',
  'JobSearchProduction.tsx',
  'JobSearch.tsx',
  'OstimJobs.tsx',
  'AvailableJobs.tsx',
];

const dirPath = path.join(__dirname, 'src', 'pages');

const replacements = [
  // 1. Root structural replacements
  { regex: /min-h-screen\s+bg-slate-900\s+text-white/g, replace: 'min-h-screen bg-transparent' },
  { regex: /min-h-screen\s+bg-slate-900/g, replace: 'min-h-screen bg-transparent' },
  { regex: /style=\{\{\s*minHeight:\s*'100vh',\s*background:\s*'linear-gradient[^}]*\}\}/g, replace: 'style={{ minHeight: "100vh" }}' },
  { regex: /style=\{\{[^}]*background:\s*'linear-gradient[^}]*\}\}/g, replace: '' },
  
  // 2. Component Backgrounds
  { regex: /bg-slate-900\/50/g, replace: 'bg-theme-card' },
  { regex: /bg-slate-900\/80/g, replace: 'bg-theme-bg' },
  { regex: /bg-slate-900/g, replace: 'bg-theme-bg' },
  { regex: /bg-slate-800\/80/g, replace: 'bg-theme-card' },
  { regex: /bg-slate-800\/50/g, replace: 'bg-theme-card' },
  { regex: /bg-slate-800/g, replace: 'bg-theme-card' },
  { regex: /bg-slate-700\/50/g, replace: 'bg-theme-card-hover' },
  { regex: /bg-slate-700/g, replace: 'bg-theme-card-hover' },
  { regex: /bg-slate-600/g, replace: 'bg-theme-border' },
  { regex: /bg-white\/5/g, replace: 'bg-theme-card-hover' },

  // 3. Text Colors (The biggest readability issue)
  { regex: /color:\s*'white'/g, replace: '' }, // Remove hardcoded inline white
  { regex: /text-slate-50/g, replace: 'text-theme-primary' },
  { regex: /text-slate-100/g, replace: 'text-theme-primary' },
  { regex: /text-slate-200/g, replace: 'text-theme-primary' },
  { regex: /text-slate-300/g, replace: 'text-theme-secondary' },
  { regex: /text-slate-400/g, replace: 'text-theme-muted' },
  { regex: /text-slate-500/g, replace: 'text-theme-muted' },

  // 4. Borders
  { regex: /border-slate-800/g, replace: 'border-theme' },
  { regex: /border-slate-700/g, replace: 'border-theme' },
  { regex: /border-slate-600/g, replace: 'border-theme' },
  { regex: /border-white\/10/g, replace: 'border-theme' },
  
  // 5. Accents and Gradients
  { regex: /from-indigo-600 to-purple-600/g, replace: 'from-theme-accent-primary to-theme-accent-secondary' },
  { regex: /from-indigo-500 to-purple-600/g, replace: 'from-theme-accent-primary to-theme-accent-secondary' },
  { regex: /from-indigo-500/g, replace: 'from-theme-accent-primary' },
  { regex: /to-purple-600/g, replace: 'to-theme-accent-secondary' },
  { regex: /to-purple-500/g, replace: 'to-theme-accent-secondary' },
  { regex: /bg-indigo-600/g, replace: 'bg-theme-accent-primary' },
  { regex: /bg-indigo-500\/10/g, replace: 'bg-theme-accent-primary/10' },
  { regex: /bg-indigo-500\/20/g, replace: 'bg-theme-accent-primary/20' },
  { regex: /text-indigo-400/g, replace: 'text-theme-accent-primary' },
  { regex: /text-indigo-500/g, replace: 'text-theme-accent-primary' },
  { regex: /border-indigo-500/g, replace: 'border-theme-accent-primary' },
  { regex: /text-purple-400/g, replace: 'text-theme-accent-secondary' }
];

let totalChanges = 0;

targetFiles.forEach(file => {
  const filePath = path.join(dirPath, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipped ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;
  
  replacements.forEach(({regex, replace}) => {
    const matches = content.match(regex);
    if (matches) {
      fileChanges += matches.length;
      content = content.replace(regex, replace);
    }
  });

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}: ${fileChanges} changes`);
    totalChanges += fileChanges;
  }
});

console.log(`Complete. Total replacements made: ${totalChanges}`);
