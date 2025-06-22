import ModelSelector from './ModelSelector';
import PromptInput from './PromptInput';


export default function ChatInputBar({
 savedLlmConfigs,
 selectedLlmConfig,
 onSelectLlmConfig,
 query,
 setQuery,
 handleAsk,
 loading,
 disabled,
 placeholder,
}) {
 // Check if selected config still exists
 const selectedConfigExists = savedLlmConfigs.some(config => config.config_name === selectedLlmConfig);
 const hasValidConfig = savedLlmConfigs.length > 0 && selectedConfigExists;
  return (
   <div className="space-y-3">
     <div className="flex items-end gap-3">
       <ModelSelector
         configs={savedLlmConfigs}
         selected={selectedLlmConfig}
         onSelect={onSelectLlmConfig}
         disabled={loading || disabled}
       />
       <div className="flex-1">
         <PromptInput
           value={query}
           onChange={setQuery}
           onSubmit={handleAsk}
           loading={loading}
           disabled={disabled || !hasValidConfig}
           placeholder={
             savedLlmConfigs.length === 0
               ? "Please configure an AI model to begin..."
               : !selectedConfigExists
               ? "Selected model no longer available. Please choose another model."
               : placeholder
           }
         />
       </div>
     </div>
    
     {/* Warning message for invalid selected config */}
     {savedLlmConfigs.length > 0 && !selectedConfigExists && selectedLlmConfig && (
       <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-3">
         <p className="text-[#f59e0b] text-sm">
           ⚠️ The selected model "{selectedLlmConfig}" is no longer available. Please select a different model from the dropdown above.
         </p>
       </div>
     )}
   </div>
 );
}
