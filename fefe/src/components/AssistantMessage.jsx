import ResultPanel from "./ResultPanel";


export default function AssistantMessage({ data }) {
 const AILogo = () => (
   <div className="w-8 h-8 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
     <svg className="w-5 h-5 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
     </svg>
   </div>
 );


 return (
   <div className="flex items-start gap-4">
     <AILogo />
     <div className="flex-1">
       {data.error ? (
         <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
           <p className="text-red-400 text-sm">{data.summary}</p>
         </div>
       ) : (
         <ResultPanel
           cleanedQuery={data.query}
           summary={data.summary}
           result={data.result}
         />
       )}
     </div>
   </div>
 );
}
