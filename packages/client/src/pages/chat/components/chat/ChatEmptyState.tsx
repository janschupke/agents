import { PageContainer } from '../../../../components/ui/layout';

export default function ChatEmptyState() {
  return (
    <PageContainer>
      <div className="flex h-full items-center justify-center">
        <div className="text-text-secondary text-center">
          <p className="mb-2">No bots available.</p>
          <p className="text-sm text-text-tertiary">Please create a bot first.</p>
        </div>
      </div>
    </PageContainer>
  );
}
