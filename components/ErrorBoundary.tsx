"use client";

import { Component, ReactNode } from "react";
import Button from "@/components/ui/Button";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-[60vh] items-center justify-center px-4"
          role="alert"
        >
          <div className="max-w-md rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
              {this.props.fallbackTitle ?? "Something went wrong"}
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              {this.props.fallbackMessage ??
                "The page hit an unexpected issue. You can try again without losing the rest of the app."}
            </p>
            <Button className="mt-5" onClick={this.reset}>
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
