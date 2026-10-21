import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertCircle, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep error logged to console for debugging
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleResetAndReload = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      // ignore
    }
    window.location.reload()
  }

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xs border border-slate-300 dark:border-slate-800 p-6 flex flex-col items-center text-center">
            {/* Warning Icon - Industrial Badge */}
            <div className="w-12 h-12 rounded-xs bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-300 dark:border-amber-800">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-[11px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
              STATUS: SYSTEM ERROR
            </div>
            <h1 className="text-base sm:text-lg font-mono font-bold tracking-tight mb-2 text-slate-950 dark:text-slate-50 uppercase">
              Terjadi Kendala Sistem
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-sans">
              Aplikasi mengalami kendala tak terduga. Klik tombol di bawah untuk memuat ulang halaman secara aman.
            </p>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-2 mb-4">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xs bg-blue-600 hover:bg-blue-700 active:translate-y-[1px] text-white font-mono font-bold text-xs uppercase border border-blue-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Muat Ulang
              </button>

              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="min-h-[40px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:translate-y-[1px] text-slate-700 dark:text-slate-300 font-mono font-bold text-xs uppercase border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                title="Hapus cache dan muat ulang"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Data
              </button>
            </div>

            {/* Expandable Technical Details */}
            {this.state.error && (
              <div className="w-full mt-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-left">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition py-1 cursor-pointer uppercase"
                >
                  <span>Detail Diagnostik</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xs border border-slate-300 dark:border-slate-800 text-[11px] font-mono overflow-x-auto text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto custom-scrollbar">
                    <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-[10px] text-slate-500 dark:text-slate-500 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
