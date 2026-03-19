import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import noAssignmentsIllustration from "@/assets/no-assignments-illustration.png";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  buttonPath: string;
}

export function EmptyState({ title, description, buttonText, buttonPath }: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 animate-fade-in">
      <img
        src={noAssignmentsIllustration}
        alt={title}
        className="h-[280px] w-auto mb-8 object-contain [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"
      />
      <h2 className="text-xl font-bold mb-2 text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      <Button
        variant="dark"
        size="lg"
        onClick={() => navigate(buttonPath)}
        className="gap-2 rounded-full px-8"
      >
        <Plus className="h-5 w-5" />
        {buttonText}
      </Button>
    </div>
  );
}
