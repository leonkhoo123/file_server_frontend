import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HomeBreadcrumbProps {
  currentPath: string;
}

export default function HomeBreadcrumb({ currentPath }: HomeBreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <div className="h-14 border-b flex items-center px-4 md:px-6 bg-background shrink-0">
      <div className="flex items-center text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/home")}
          className="p-1 h-auto bg-transparent hover:bg-transparent hover:underline text-foreground"
        >
          Home
        </Button>
        {currentPath.split("/").filter(Boolean).map((part, idx, arr) => (
          <span key={idx} className="flex items-center">
            <span className="mx-1 text-muted-foreground/50">/</span>
            <button
              onClick={() => {
                const targetPath = "/" + arr.slice(0, idx + 1).join("/");
                void navigate("/home" + targetPath);
              }}
              className="hover:underline hover:text-foreground transition-colors"
            >
              {part}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
