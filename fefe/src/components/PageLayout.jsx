import { Link } from "react-router-dom";


export default function PageLayout({ children, title, subtitle }) {
 return (
   <div className="min-h-screen bg-[#0a0a0a] text-white">
     <header className="bg-[#1a1a1a]/80 backdrop-blur-sm border-b border-[#2a2a2a] sticky top-0 z-20">
       <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex items-center justify-between h-16">
           <div className="flex items-center space-x-4">
             <Link to="/" className="p-2 rounded-md hover:bg-[#2a2a2a] transition-colors" title="Back to main chat">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
             </Link>
             <div>
               <h1 className="text-lg font-medium text-white">{title}</h1>
               {subtitle && <p className="text-sm text-[#888888]">{subtitle}</p>}
             </div>
           </div>
         </div>
       </div>
     </header>
     <main>
       <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
         {children}
       </div>
     </main>
   </div>
 );
}


