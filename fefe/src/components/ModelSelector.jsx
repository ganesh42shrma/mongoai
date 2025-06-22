export default function ModelSelector({ configs, selected, onSelect, disabled }) {
 if (configs.length === 0) {
   return null;
 }


 return (
   <div className="flex-shrink-0">
     <select
       value={selected || ''}
       onChange={(e) => onSelect(e.target.value)}
       disabled={disabled}
       className="h-10 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#0ea5e9] transition-colors disabled:opacity-50"
       title="Select AI Model"
     >
       {configs.length === 0 && <option>No models configured</option>}
       {configs.map(config => (
         <option key={config.config_name} value={config.config_name}>
           {config.config_name} ({config.provider})
         </option>
       ))}
     </select>
   </div>
 );
}