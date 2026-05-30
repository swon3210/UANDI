import { UserPostCard, type UserPostCardProps } from './UserPostCard';
import { LinkPostCard, type LinkPostCardProps } from './LinkPostCard';

export type CommunityPostCardProps =
  | ({ type: 'user' } & UserPostCardProps)
  | ({ type: 'scraped' } & LinkPostCardProps);

export function CommunityPostCard(props: CommunityPostCardProps) {
  if (props.type === 'user') {
    return (
      <UserPostCard
        author={props.author}
        body={props.body}
        imageUrl={props.imageUrl}
        actionSlot={props.actionSlot}
      />
    );
  }
  return (
    <LinkPostCard
      title={props.title}
      body={props.body}
      siteName={props.siteName}
      ogImageUrl={props.ogImageUrl}
      url={props.url}
      timeLabel={props.timeLabel}
      actionSlot={props.actionSlot}
    />
  );
}
