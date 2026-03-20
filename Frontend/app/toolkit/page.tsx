"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/EmptyState";

export default function ToolkitPage() {
  return (
    <AppLayout title="AI Teacher's Toolkit">
      <EmptyState
        title="No tools used yet"
        description="Explore the AI Teacher's Toolkit to generate question papers, create lesson plans, and automate grading with the power of AI."
        buttonText="Explore Toolkit"
        buttonPath="/toolkit"
      />
    </AppLayout>
  );
}
