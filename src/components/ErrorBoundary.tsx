import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            padding: "2rem",
            textAlign: "center",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
          <h2
            style={{
              color: "var(--brand-error)",
              marginBottom: "1rem",
              fontSize: "1.5rem",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "2rem",
              maxWidth: "500px",
              lineHeight: "1.6",
            }}
          >
            We're sorry, but there was an error loading this part of the
            application. Please try refreshing the page or contact support if
            the issue persists.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0, 212, 170, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            🔄 Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details
              style={{
                marginTop: "2rem",
                padding: "1rem",
                background: "var(--bg-secondary)",
                borderRadius: "8px",
                maxWidth: "600px",
                textAlign: "left",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  color: "var(--brand-error)",
                  fontWeight: "600",
                }}
              >
                Error Details (Development)
              </summary>
              <pre
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-tertiary)",
                  marginTop: "1rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
