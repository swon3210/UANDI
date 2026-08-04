import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProfileAvatarUploader } from './ProfileAvatarUploader';

const meta: Meta<typeof ProfileAvatarUploader> = {
  title: 'Settings/프로필/사진 업로더',
  component: ProfileAvatarUploader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '프로필 사진 미리보기 + 변경/삭제. 사진이 없으면 이름 첫 글자 이니셜로 폴백한다. ' +
          '압축·업로드·삭제는 상위(페이지)가 처리하고 여기선 파일 선택 이벤트만 올린다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProfileAvatarUploader>;

const SAMPLE_PHOTO = 'https://i.pravatar.cc/150?img=47';

function Demo({
  initialPhotoURL,
  displayName,
}: {
  initialPhotoURL: string | null;
  displayName: string;
}) {
  const [photoURL, setPhotoURL] = useState<string | null>(initialPhotoURL);
  return (
    <ProfileAvatarUploader
      photoURL={photoURL}
      displayName={displayName}
      onSelectFile={(file) => setPhotoURL(URL.createObjectURL(file))}
      onRemove={() => setPhotoURL(null)}
    />
  );
}

export const WithPhoto: Story = {
  name: '사진 있음',
  render: () => <Demo initialPhotoURL={SAMPLE_PHOTO} displayName="김민지" />,
};

export const WithoutPhoto: Story = {
  name: '사진 없음 (이니셜 폴백)',
  render: () => <Demo initialPhotoURL={null} displayName="김민지" />,
};

export const Uploading: Story = {
  name: '업로드 중',
  args: {
    photoURL: null,
    displayName: '김민지',
    uploadProgress: 42,
    onSelectFile: () => {},
    onRemove: () => {},
  },
};

export const Disabled: Story = {
  name: '비활성화',
  args: {
    photoURL: SAMPLE_PHOTO,
    displayName: '김민지',
    disabled: true,
    onSelectFile: () => {},
    onRemove: () => {},
  },
};
