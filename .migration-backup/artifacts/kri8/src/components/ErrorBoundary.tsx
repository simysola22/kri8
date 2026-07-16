import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-card p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive opacity-80" />
          <div>
            <p className="font-semibold text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 hover:bg-white/10"
            onClick={this.reset}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Thin function wrapper for use in JSX where class components are awkward */
export function withErrorBoundary(children: ReactNode, fallback?: ReactNode) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
