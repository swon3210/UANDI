import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllSlugs, getDocBySlug } from '@/lib/docs';
import { DocContent } from '@/components/DocContent';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);
  return {
    title: doc ? `${doc.title} — UANDI Docs` : 'Not Found',
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) notFound();

  return <DocContent html={doc.content} />;
}
