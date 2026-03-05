'use client';

import React, { Component, type ReactNode } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 48px 24px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #191F22;
  margin: 0 0 8px;
`;

const Message = styled.p`
  font-size: 14px;
  color: #9CA3AF;
  margin: 0 0 24px;
  max-width: 400px;
`;

const RetryButton = styled.button`
  padding: 8px 20px;
  background: #3B82F6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #2563EB; }
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Container>
          <Title>Une erreur est survenue</Title>
          <Message>
            {this.state.error?.message || 'Erreur inattendue. Veuillez réessayer.'}
          </Message>
          <RetryButton onClick={this.handleRetry}>Réessayer</RetryButton>
        </Container>
      );
    }

    return this.props.children;
  }
}
