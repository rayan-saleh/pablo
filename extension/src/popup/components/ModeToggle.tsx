import React from 'react';
import type { InspectorMode } from '../../shared/types';

interface ModeToggleProps {
  mode: InspectorMode;
  onChange: (mode: InspectorMode) => void;
  disabled: boolean;
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex rounded-md border border-pablo-border bg-pablo-surface p-0.5">
      <button
        className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
          mode === 'component'
            ? 'bg-pablo-elevated text-pablo-primary shadow-glow-primary'
            : 'text-pablo-muted hover:text-pablo-text-secondary'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        onClick={() => onChange('component')}
        disabled={disabled}
      >
        component
      </button>
      <button
        className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
          mode === 'page'
            ? 'bg-pablo-elevated text-pablo-primary shadow-glow-primary'
            : 'text-pablo-muted hover:text-pablo-text-secondary'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        onClick={() => onChange('page')}
        disabled={disabled}
      >
        page
      </button>
    </div>
  );
}
