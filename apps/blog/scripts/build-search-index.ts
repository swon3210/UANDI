import fs from 'fs';
import path from 'path';
import lunr from 'lunr';
import { getAllPosts } from '../src/lib/posts';
import { getCategoryLabel } from '../src/lib/taxonomy';

type SearchRecord = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  category: string;
  categoryLabel: string;
  date: string;
};

const posts = getAllPosts().filter((p) => !p.draft);

const records: SearchRecord[] = posts.map((p) => ({
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  tags: p.tags,
  category: p.category,
  categoryLabel: getCategoryLabel(p.category),
  date: p.date,
}));

const index = lunr(function () {
  this.ref('slug');
  this.field('title', { boost: 5 });
  this.field('tags', { boost: 3 });
  this.field('categoryLabel', { boost: 2 });
  this.field('summary', { boost: 1 });

  records.forEach((r) => {
    this.add({
      slug: r.slug,
      title: r.title,
      tags: r.tags.join(' '),
      categoryLabel: r.categoryLabel,
      summary: r.summary,
    });
  });
});

const output = { index: index.toJSON(), records };
const outDir = path.join(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'search-index.json');
fs.writeFileSync(outPath, JSON.stringify(output), 'utf-8');

console.log(
  `[build-search-index] indexed ${records.length} posts → ${path.relative(process.cwd(), outPath)}`,
);
