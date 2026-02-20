import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TopLevelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Top-level error caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render a minimal, self-contained error UI that doesn't depend on any app providers
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: 'hsl(0 0% 100%)',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                borderRadius: '9999px',
                backgroundColor: 'hsl(0 84.2% 60.2% / 0.1)',
                padding: '1rem',
              }}>
                <AlertCircle style={{
                  height: '3rem',
                  width: '3rem',
                  color: 'hsl(0 84.2% 60.2%)',
                }} />
              </div>
            </div>
            
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: 'hsl(0 0% 9%)',
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              color: 'hsl(0 0% 45.1%)',
              marginBottom: '1.5rem',
            }}>
              The application encountered an unexpected error. Please try reloading the page.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: 'hsl(0 0% 96.1%)',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  color: 'hsl(0 0% 45.1%)',
                  wordBreak: 'break-all',
                }}>
                  {this.state.error.message}
                </p>
              </div>
            )}

            <Button 
              onClick={this.handleReload}
              size="lg"
              style={{ width: '100%' }}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
