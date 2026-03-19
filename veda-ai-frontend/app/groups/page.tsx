"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/EmptyState";

export default function GroupsPage() {
  return (
    <AppLayout title="My Groups">
      <EmptyState
        title="No groups yet"
        description="Create your first group to start organizing your students. You can manage classes, share assignments, and track progress."
        buttonText="Create Your First Group"
        buttonPath="/groups/create"
      />
    </AppLayout>
  );
}
