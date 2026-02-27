import React from 'react';
import type { InspectorMode } from '../../shared/types';

interface ModeToggleProps {
  mode: InspectorMode;
  onChange: (mode: InspectorMode) => void;
  disabled: boolean;
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1">
      <button
        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === 'component'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onChange('component')}
        disabled={disabled}
      >
        Component
      </button>
      <button
        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === 'page'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onChange('page')}
        disabled={disabled}
      >
        Page
      </button>
    </div>
  );
}
