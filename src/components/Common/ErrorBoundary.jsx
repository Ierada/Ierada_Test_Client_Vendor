import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Catches render-time crashes anywhere below it (e.g. a missing import, or
// reading a property off an unexpected null/undefined) and shows a friendly
// screen instead of a blank white page. Route changes reset it via `key` in
// App.jsx so a crash on one page doesn't lock out the rest of the app.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Vendor UI crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500">
            This page hit an unexpected error. Your data is safe — try
            reloading, or go back and try again.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Reload page
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/dashboard")}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
