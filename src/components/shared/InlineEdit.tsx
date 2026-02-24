'use client';

import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const Display = styled.span`
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid transparent;

  &:hover {
    border-color: #D9DEE1;
    background: #F9FAFB;
  }
`;

const Input = styled.input`
  padding: 2px 4px;
  border: 1px solid #A0EBF0;
  border-radius: 4px;
  font-size: inherit;
  font-family: inherit;
  outline: none;
  width: 100%;
`;

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
}

export function InlineEdit({ value, onSave, placeholder = '' }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <Display onClick={() => setEditing(true)}>
      {value || <span style={{ color: '#9CA3AF' }}>{placeholder}</span>}
    </Display>
  );
}
