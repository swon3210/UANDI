import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllSlugs, getPostBySlug } from '@/lib/posts';
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
    title: `${post.title} | UANDI Dev Blog`,
    description: post.summary,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return <PostContent post={post} />;
}
