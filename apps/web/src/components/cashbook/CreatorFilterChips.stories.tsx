import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CreatorFilterChips, type FilterMember } from './CreatorFilterChips';

const meta: Meta<typeof CreatorFilterChips> = {
  title: 'Cashbook/CreatorFilterChips',
  component: CreatorFilterChips,
};

export default meta;
type Story = StoryObj<typeof CreatorFilterChips>;

const twoMembers: FilterMember[] = [
  { uid: 'u1', displayName: '지은', photoURL: 'https://i.pravatar.cc/80?img=5' },
  { uid: 'u2', displayName: '민준', photoURL: null },
];

function Interactive({ members, initial }: { members: FilterMember[]; initial: string[] }) {
  const [value, setValue] = useState<string[]>(initial);
  const toggle = (uid: string) =>
    setValue((v) => (v.includes(uid) ? v.filter((x) => x !== uid) : [...v, uid]));
  return (
    <div className="max-w-sm space-y-2">
      <CreatorFilterChips members={members} value={value} onToggle={toggle} />
      <p className="text-xs text-muted-foreground">
        선택: {value.length === 0 ? '전체' : value.join(', ')}
      </p>
    </div>
  );
}

/** 커플 2인, 아무도 선택하지 않은 상태(= 전체). */
export const Empty: Story = {
  render: () => <Interactive members={twoMembers} initial={[]} />,
};

/** 한 명 선택. */
export const OneSelected: Story = {
  render: () => <Interactive members={twoMembers} initial={['u1']} />,
};

/** 긴 이름 + 사진 없는 멤버(이니셜 폴백). */
export const LongName: Story = {
  render: () => (
    <Interactive
      members={[
        { uid: 'u1', displayName: '아주아주긴이름을가진사람', photoURL: null },
        { uid: 'u2', displayName: 'Alexander', photoURL: null },
      ]}
      initial={['u1']}
    />
  ),
};

/** 멤버가 1명뿐이면 섹션이 렌더되지 않는다(빈 화면). */
export const SingleMemberHidden: Story = {
  render: () => (
    <Interactive members={[{ uid: 'u1', displayName: '지은', photoURL: null }]} initial={[]} />
  ),
};
