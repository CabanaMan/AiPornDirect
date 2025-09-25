import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'src', 'schema', 'tools.schema.json');
const dataPath = path.join(rootDir, 'src', 'data', 'tools.json');
const categoriesPath = path.join(rootDir, 'src', 'data', 'categories.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const valid = validate(data);

if (!valid) {
  console.error('Schema errors:', validate.errors);
  process.exit(1);
}

const categoryIds = new Set(categories.map((cat) => cat.id));
const slugs = new Set();
const ids = new Set();
let hasErrors = false;

for (const tool of data.tools) {
  if (slugs.has(tool.slug)) {
    console.error(`Duplicate slug detected: ${tool.slug}`);
    hasErrors = true;
  }
  slugs.add(tool.slug);

  if (ids.has(tool.id)) {
    console.error(`Duplicate id detected: ${tool.id}`);
    hasErrors = true;
  }
  ids.add(tool.id);

  const missingCategories = (tool.categories || []).filter((category) => !categoryIds.has(category));
  if (missingCategories.length) {
    console.error(`Tool ${tool.slug} references unknown categories: ${missingCategories.join(', ')}`);
    hasErrors = true;
  }

  if (!tool.description || tool.description.split(' ').length < 40) {
    console.warn(`Description for ${tool.slug} could be longer to meet editorial guidelines.`);
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log(`OK: tools.json valid (${data.tools.length} tools).`);
