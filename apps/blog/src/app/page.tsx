import { getAllPosts, getAllTags } from '@/lib/posts';
import { PostCard } from '@/components/PostCard';
import { TagFilter } from '@/components/TagFilter';

export default function BlogHomePage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <TagFilter tags={tags} />
      <div className="mt-6 space-y-8">
        {posts.length === 0 ? (
          <p className="text-sm text-gray-400">
            아직 작성된 글이 없습니다.
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </>
  );
}
