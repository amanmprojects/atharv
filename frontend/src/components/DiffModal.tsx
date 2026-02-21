'use client';

import { StyleTransformResult } from '@/lib/api';
import { X, ArrowRight, Info } from 'lucide-react';
import { useMemo } from 'react';

interface DiffModalProps {
  result: StyleTransformResult;
  onClose: () => void;
  onApply?: (transformed: string) => void;
}

export default function DiffModal({ result, onClose, onApply }: DiffModalProps) {
  const diffWords = useMemo(() => {
    const originalWords = result.original.split(/(\s+)/);
    const transformedWords = result.transformed.split(/(\s+)/);
    
    const originalSet = new Set(originalWords.filter(w => w.trim()));
    const transformedSet = new Set(transformedWords.filter(w => w.trim()));
    
    return {
      removed: [...originalSet].filter(w => !transformedSet.has(w)),
      added: [...transformedSet].filter(w => !originalSet.has(w)),
    };
  }, [result.original, result.transformed]);

  const groupedChanges = useMemo(() => {
    const groups: Record<string, typeof result.changes> = {};
    
    for (const change of result.changes) {
      const type = change.change_type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(change);
    }
    
    return groups;
  }, [result.changes]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Style Transformation</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-medium text-sm text-gray-500 mb-2">Original</h3>
              <div className="border rounded p-3 bg-gray-50 text-sm leading-relaxed max-h-48 overflow-y-auto">
                {result.original}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-500 mb-2">Transformed</h3>
              <div className="border rounded p-3 bg-blue-50 text-sm leading-relaxed max-h-48 overflow-y-auto">
                {result.transformed}
              </div>
            </div>
          </div>

          {result.changes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-sm text-gray-500 mb-3 flex items-center gap-2">
                <Info size={16} />
                Changes Made ({result.changes.length})
              </h3>
              <div className="space-y-3">
                {Object.entries(groupedChanges).map(([type, changes]) => (
                  <div key={type} className="bg-gray-50 rounded p-3">
                    <p className="text-xs font-medium text-gray-600 uppercase mb-2">
                      {type.replace(/_/g, ' ')} ({changes.length})
                    </p>
                    <ul className="space-y-1">
                      {changes.slice(0, 5).map((change, idx) => (
                        <li key={idx} className="text-sm flex items-center gap-2">
                          <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs line-through">
                            {change.original}
                          </span>
                          <ArrowRight size={14} className="text-gray-400" />
                          <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">
                            {change.replacement}
                          </span>
                        </li>
                      ))}
                      {changes.length > 5 && (
                        <li className="text-xs text-gray-500">
                          +{changes.length - 5} more changes
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded p-3">
            <p className="text-sm text-blue-800">{result.explanation}</p>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApply?.(result.transformed);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
