'use client';

import { ReportDialog, type ReportReason } from '@uandi/ui';

type CommunityReportDialogProps = {
  isOpen: boolean;
  onSubmit: (reason: ReportReason) => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function CommunityReportDialog(props: CommunityReportDialogProps) {
  return <ReportDialog {...props} />;
}
