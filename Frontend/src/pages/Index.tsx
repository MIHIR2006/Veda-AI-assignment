import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/EmptyState";

export default function HomePage() {
  return (
    <AppLayout>
      <EmptyState
        title="No assignments yet"
        description="Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading."
        buttonText="Create Your First Assignment"
        buttonPath="/assignments/create"
      />
    </AppLayout>
  );
}
