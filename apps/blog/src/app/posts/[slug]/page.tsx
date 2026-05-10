import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllSlugs, getPostBySlug, getSeriesBySlug } from '@/lib/posts';
import { CATEGORIES } from '@/lib/taxonomy';
import { PostContent } from '@/components/PostContent';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | 독개의 개발블로그`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      section: CATEGORIES[post.category].label,
      tags: post.tags,
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const series = post.series ? getSeriesBySlug(post.series) : null;

  return <PostContent post={post} series={series} />;
}
