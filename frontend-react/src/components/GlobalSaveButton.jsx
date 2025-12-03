import { Save, AlertCircle } from 'lucide-react';
import { useSave } from '../hooks/useSave';

export default function GlobalSaveButton({ 
  show = true,
  onSaveComplete,
  className = '' 
}) {
  const { isSaving, isUploading, uploadProgress, hasChanges } = useSave();

  if (!show || !hasChanges()) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-2xl border-2 border-orange-500 overflow-hidden">
        {/* Header with warning */}
        <div className="bg-orange-50 px-4 py-2 border-b border-orange-200 flex items-center gap-2">
          <AlertCircle size={16} className="text-orange-600" />
          <span className="text-sm font-medium text-orange-900">
            You have unsaved changes
          </span>
        </div>

        {/* Save button */}
        <div className="p-4">
          <button
            onClick={onSaveComplete}
            disabled={isSaving}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-lg"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Uploading files...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-200" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
