import fs from 'fs';
import path from 'path';

const replaceInFile = (filePath: string) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // If the file uses a store selector with || [], we replace it with || EMPTY_ARRAY
  // We need to make sure we also add const EMPTY_ARRAY: any[] = []; if it doesn't exist
  
  const regex = /use\w+Store\([\s\S]*?\|\|\s*\[\]\)/g;
  
  if (regex.test(content)) {
    content = content.replace(/(\|\|\s*)\[\](\))/g, '$1EMPTY_ARRAY$2');
    
    if (!content.includes('const EMPTY_ARRAY')) {
      // Add after imports
      const lastImportMatch = [...content.matchAll(/^import.*?;/gm)].pop();
      if (lastImportMatch) {
        const insertIndex = lastImportMatch.index! + lastImportMatch[0].length;
        content = content.slice(0, insertIndex) + '\n\nconst EMPTY_ARRAY: any[] = [];' + content.slice(insertIndex);
      } else {
        content = 'const EMPTY_ARRAY: any[] = [];\n\n' + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
    return true;
  }
  return false;
};

const walkSync = (dir: string, filelist: string[] = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo') {
        filelist = walkSync(path.join(dir, file), filelist);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      filelist.push(path.join(dir, file));
    }
  }
  return filelist;
};

const targetDirs = [
  path.join(__dirname, 'components'),
  path.join(__dirname, 'app')
];

let updatedCount = 0;
for (const dir of targetDirs) {
  if (fs.existsSync(dir)) {
    const files = walkSync(dir);
    for (const file of files) {
      if (replaceInFile(file)) {
        updatedCount++;
      }
    }
  }
}

console.log(`Updated ${updatedCount} files.`);
