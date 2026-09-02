import React from "react";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default class ListingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected error",
    };
  }

  componentDidCatch(error, info) {
    console.error("ListingErrorBoundary", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-600 max-w-md">
            This listing action failed unexpectedly. Your draft may still be saved locally.
          </p>
          <p className="text-xs text-gray-400">{this.state.message}</p>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-primary-100 text-white text-sm"
              onClick={() => this.setState({ hasError: false, message: "" })}
            >
              Try again
            </button>
            <Link to="/product" className="px-4 py-2 rounded-xl border text-sm">
              Back to products
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
