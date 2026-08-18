'use client';

import { DiaryOwnerGate } from './DiaryOwnerGate';
import { DiaryEntryForm } from './DiaryEntryForm';

export function DiaryWriteView() {
  return <DiaryOwnerGate>{(ownerUid) => <DiaryEntryForm ownerUid={ownerUid} />}</DiaryOwnerGate>;
}
