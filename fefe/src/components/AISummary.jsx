import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export default function AISummary({ summary }) {
 const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
 const [isAnimating, setIsAnimating] = useState(false);
 const [animatedLines, setAnimatedLines] = useState([]);
 const [thinkingText, setThinkingText] = useState("");
 const [finalSummary, setFinalSummary] = useState("");
 const [copied, setCopied] = useState(false);


 useEffect(() => {
   if (!summary) return;


   const thinkMatch = summary.match(/<think>([\s\S]*?)<\/think>/);
   const cleanSummary = summary.replace(/<think>[\s\S]*?<\/think>/, "").trim();


   // Reset states for new query
   setAnimatedLines([]);
   setFinalSummary("");
   setCopied(false); // Reset copied state on new summary


   if (thinkMatch) {
     const allLines = thinkMatch[1].split("\n").map(line => line.trim()).filter(Boolean);
     setThinkingText(allLines.join("\n"));
     setIsAnimating(true);
     setIsThinkingExpanded(true);


     let i = 0;
     const interval = setInterval(() => {
       if (i < allLines.length) {
         setAnimatedLines((prev) => [...prev, allLines[i]]);
         i++;
       } else {
         clearInterval(interval);
         setIsAnimating(false);
         setFinalSummary(cleanSummary); // Set summary AFTER animation
         // Auto-collapse the thinking section after animation
         setTimeout(() => setIsThinkingExpanded(false), 1000);
       }
     }, 700);


     return () => clearInterval(interval);
   } else {
     setThinkingText("");
     setFinalSummary(cleanSummary); // Set summary immediately
     setIsAnimating(false);
   }
 }, [summary]);


 const handleCopy = () => {
   navigator.clipboard.writeText(finalSummary);
   setCopied(true);
   setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
 };


 return (
   <div className="space-y-4">
     {thinkingText && (
       <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
         <button
           onClick={() => setIsThinkingExpanded(prev => !prev)}
           className="w-full flex items-center justify-between p-4 hover:bg-[#2a2a2a]/50 transition-colors"
         >
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-[#facc15] rounded-full"></div>
             <h3 className="text-[#facc15] font-medium text-sm">AI Thought Process</h3>
           </div>
           <svg
             className={`w-4 h-4 text-[#888888] transition-transform ${isThinkingExpanded ? "rotate-180" : ""}`}
             fill="none"
             stroke="currentColor"
             viewBox="0 0 24 24"
           >
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
           </svg>
         </button>
         {isThinkingExpanded && (
           <div className="p-4">
             {isAnimating ? (
               animatedLines.map((line, idx) => (
                 <p key={idx} className="text-[#facc15] animate-pulse italic text-sm">
                   {line}
                 </p>
               ))
             ) : (
               <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                 <p className="text-gray-400 italic text-sm whitespace-pre-wrap">
                   {thinkingText}
                 </p>
               </div>
             )}
           </div>
         )}
       </div>
     )}


     {!isAnimating && finalSummary && (
       <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 relative">
         <button
           onClick={handleCopy}
           className="absolute top-3 right-3 text-xs text-[#888888] hover:text-white transition-colors flex items-center gap-1.5 bg-[#2a2a2a] px-2 py-1 rounded-md"
           disabled={copied}
         >
           {copied ? (
             <>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
               </svg>
               Copied!
             </>
           ) : (
             <>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
               </svg>
               Copy
             </>
           )}
         </button>
         <div className="prose prose-invert max-w-none text-[#cccccc] text-sm leading-relaxed prose-p:my-2 prose-headings:my-4 prose-ul:my-4 prose-li:my-1">
           <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalSummary}</ReactMarkdown>
         </div>
       </div>
     )}
   </div>
 );
}