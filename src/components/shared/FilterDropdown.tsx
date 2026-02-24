'use client';

import styled from 'styled-components';

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #D9DEE1;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  color: #191F22;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #A0EBF0;
  }
`;

interface FilterDropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

export function FilterDropdown<T extends string>({
  value,
  onChange,
  options,
}: FilterDropdownProps<T>) {
  return (
    <Select value={value} onChange={e => onChange(e.target.value as T)}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
