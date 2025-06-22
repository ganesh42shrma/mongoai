import { useState, useCallback } from "react";
import AISummary from "./AISummary"; // adjust path as needed




export default function ResultPanel({ cleanedQuery, summary, result }) {
 const [expandedSections, setExpandedSections] = useState({
   query: true,
   result: false,
 });


 const toggleSection = (section) => {
   setExpandedSections((prev) => ({
     ...prev,
     [section]: !prev[section],
   }));
 };


 const formatResult = (data) => {
   try {
     return JSON.stringify(data, null, 2);
   } catch {
     return String(data);
   }
 };




 return (
   <div className="space-y-4">
     {/* Query Section */}
     {cleanedQuery && (
       <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
         <button
           onClick={() => toggleSection("query")}
           className="w-full flex items-center justify-between p-4 hover:bg-[#2a2a2a]/50 transition-colors"
         >
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
             <h3 className="text-[#10b981] font-medium text-sm">
               Processed Query
             </h3>
           </div>
           <svg
             className={`w-4 h-4 text-[#888888] transition-transform ${
               expandedSections.query ? "rotate-180" : ""
             }`}
             fill="none"
             stroke="currentColor"
             viewBox="0 0 24 24"
           >
             <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={1.5}
               d="M19 9l-7 7-7-7"
             />
           </svg>
         </button>
         {expandedSections.query && (
           <div className="px-4 pb-4">
             <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
               <code className="text-sm text-[#cccccc] font-mono whitespace-pre-wrap">
                 {typeof cleanedQuery === "object"
                   ? JSON.stringify(cleanedQuery, null, 2)
                   : cleanedQuery}
               </code>
             </div>
           </div>
         )}
       </div>
     )}




     {/* Summary Section */}
     {summary && <AISummary summary={summary} />}




     {/* Result Section */}
     {result && (
       <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
         <button
           onClick={() => toggleSection("result")}
           className="w-full flex items-center justify-between p-4 hover:bg-[#2a2a2a]/50 transition-colors"
         >
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-[#0ea5e9] rounded-full"></div>
             <h3 className="text-[#0ea5e9] font-medium text-sm">Raw Data</h3>
             <span className="text-xs bg-[#2a2a2a] px-2 py-1 rounded-full text-[#888888]">
               {Array.isArray(result) ? `${result.length} items` : "Object"}
             </span>
           </div>
           <svg
             className={`w-4 h-4 text-[#888888] transition-transform ${
               expandedSections.result ? "rotate-180" : ""
             }`}
             fill="none"
             stroke="currentColor"
             viewBox="0 0 24 24"
           >
             <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={1.5}
               d="M19 9l-7 7-7-7"
             />
           </svg>
         </button>
         {expandedSections.result && (
           <div className="px-4 pb-4">
             <div className="bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] max-h-96 overflow-y-auto">
               <pre className="p-3 text-sm text-[#cccccc] font-mono whitespace-pre-wrap">
                 {formatResult(result)}
               </pre>
             </div>
             <div className="flex justify-end mt-2">
               <button
                 onClick={() =>
                   navigator.clipboard.writeText(formatResult(result))
                 }
                 className="text-xs text-[#888888] hover:text-white transition-colors flex items-center gap-1"
               >
                 <svg
                   className="w-3 h-3"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={1.5}
                     d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                   />
                 </svg>
                 Copy JSON
               </button>
             </div>
           </div>
         )}
       </div>
     )}
   </div>
 );
}