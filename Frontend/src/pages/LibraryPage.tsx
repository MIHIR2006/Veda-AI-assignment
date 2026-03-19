import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/EmptyState";

export default function LibraryPage() {
  return (
    <AppLayout title="My Library">
      <EmptyState
        title="No items in library yet"
        description="Your library is where you'll find saved question papers, assignments, and teaching resources. Start creating to build your collection."
        buttonText="Create Your First Resource"
        buttonPath="/assignments/create"
      />
    </AppLayout>
  );
}
