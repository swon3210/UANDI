import type { Metadata } from 'next';
import { getAllTags, getPostsByTag } from '@/lib/posts';
import { PostCard } from '@/components/PostCard';
import { TagFilter } from '@/components/TagFilter';

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} | UANDI Dev Blog`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  const tags = getAllTags();

  return (
    <>
      <TagFilter tags={tags} activeTag={tag} />
      <div className="mt-6 space-y-8">
        {posts.length === 0 ? (
          <p className="text-sm text-gray-400">
            이 태그의 글이 없습니다.
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </>
  );
}
