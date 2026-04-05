import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public readonly props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("The Oracle crashed:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-black text-red-600 font-bold text-center border-4 border-red-600 fixed inset-0 z-50">
            <h1 className="text-3xl mb-6 uppercase tracking-widest font-black">System Failure</h1>
            <p className="mb-8 text-sm uppercase tracking-wider opacity-80">The Oracle encountered a paradox in the void.</p>
            <button 
                onClick={() => window.location.reload()}
                className="px-8 py-4 border-2 border-red-600 hover:bg-red-600 hover:text-black uppercase tracking-widest transition-colors font-bold text-xs"
            >
                Reset Connection
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}