import React, { useState } from "react";
import TarkaLogo from "../assets/tarka_logo.png";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export default function Sidebar({
 collections = [],
 onSelect,
 selectedCollection,
 dbConfig,
 onDbConfigChange,
 toggleSidebar,
 isOpen,
}) {
 const [isEditing, setIsEditing] = useState(false);


 const handleConnect = () => {
   if (dbConfig.dbUri && dbConfig.dbName) {
     onDbConfigChange({ ...dbConfig, shouldConnect: true });
     setIsEditing(false);
   }
 };


 const handleInputChange = (field, value) => {
   onDbConfigChange({ ...dbConfig, [field]: value, shouldConnect: false });
 };


 const handleEdit = () => {
   setIsEditing(true);
   onDbConfigChange({ ...dbConfig, shouldConnect: false });
 };


 return (
   <aside
     className={`transition-all duration-300 ${
       isOpen ? "w-64" : "w-0"
     } h-full bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col`}
   >
     {/* Header */}
     <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
       <div className="flex items-center gap-3">
         <div>
           <img src={TarkaLogo} alt="Tarka Logo" className="w-12 h-12" /> 
         </div>
         {isOpen && (
           <div>
             <h2 className="text-base font-medium text-white">Tarka</h2>
           </div>
         )}
       </div>
       <button
         onClick={toggleSidebar}
         className="text-[#888888] hover:text-white focus:outline-none"
       >
         <svg
           className="w-5 h-5"
           fill="none"
           stroke="currentColor"
           viewBox="0 0 24 24"
         >
           <path
             strokeLinecap="round"
             strokeLinejoin="round"
             strokeWidth={2}
             d={isOpen ? "M6 18L18 12L6 6" : "M18 6L6 12L18 18"}
           />
         </svg>
       </button>
     </div>


     {/* MongoDB Connection */}
     <div className="p-4 border-b border-[#1a1a1a]">
       {!dbConfig.shouldConnect || isEditing ? (
         <div className="space-y-3">
           <div>
             <label
               htmlFor="dbUri"
               className="block text-xs font-medium text-[#888888] mb-1"
             >
               MongoDB URI
             </label>
             <input
               id="dbUri"
               type="text"
               value={dbConfig.dbUri}
               onChange={(e) => handleInputChange("dbUri", e.target.value)}
               className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#0ea5e9] transition-colors"
               placeholder="mongodb://localhost:27017"
             />
           </div>
           <div>
             <label
               htmlFor="dbName"
               className="block text-xs font-medium text-[#888888] mb-1"
             >
               Database Name
             </label>
             <input
               id="dbName"
               type="text"
               value={dbConfig.dbName}
               onChange={(e) => handleInputChange("dbName", e.target.value)}
               className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#0ea5e9] transition-colors"
               placeholder="mydb"
             />
           </div>
           <button
             onClick={handleConnect}
             disabled={!dbConfig.dbUri || !dbConfig.dbName}
             className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
               dbConfig.dbUri && dbConfig.dbName
                 ? "bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white"
                 : "bg-[#1a1a1a] text-[#666666] cursor-not-allowed"
             }`}
           >
             {isEditing ? "Save & Connect" : "Connect"}
           </button>
         </div>
       ) : (
         <div className="space-y-3">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-xs font-medium text-[#888888]">
                 Connected Database
               </p>
               <p className="text-sm text-white truncate">{dbConfig.dbName}</p>
             </div>
             <button
               onClick={handleEdit}
               className="p-2 text-[#888888] hover:text-white transition-colors"
             >
               <svg
                 className="w-4 h-4"
                 fill="none"
                 stroke="currentColor"
                 viewBox="0 0 24 24"
               >
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={1.5}
                   d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                 />
               </svg>
             </button>
           </div>
         </div>
       )}
     </div>


     {/* Navigation */}
     <div className="p-4 border-b border-[#1a1a1a]">
       <div className="space-y-2">
         <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wider mb-3">
           Settings
         </h3>
         <a
           href="#/models"
           className="flex items-center gap-3 px-3 py-2 text-sm text-[#cccccc] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
           </svg>
           <span>Model Configuration</span>
         </a>
       </div>
     </div>


     {/* Collections */}
     <div className="flex-1 overflow-y-auto p-3">
       <div className="mb-3">
         <div className="flex items-center justify-between mb-3">
           <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wider">
             Collections
           </h3>
         </div>


         {collections.length === 0 ? (
           <div className="text-center py-8">
             <div className="w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center mx-auto mb-3">
               <svg
                 className="w-5 h-5 text-[#666666]"
                 fill="none"
                 stroke="currentColor"
                 viewBox="0 0 24 24"
               >
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={1.5}
                   d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                 />
               </svg>
             </div>
             <p className="text-sm text-[#666666]">
               {!dbConfig.dbUri || !dbConfig.dbName
                 ? "Enter connection details above"
                 : !dbConfig.shouldConnect
                 ? "Click Connect to load collections"
                 : "Loading collections..."}
             </p>
           </div>
         ) : (
           <ul className="space-y-1">
             {collections.map((col, i) => (
               <li key={i}>
                 <button
                   onClick={() => onSelect(col)}
                   className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                     selectedCollection === col
                       ? "bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20"
                       : "text-[#cccccc] hover:bg-[#1a1a1a] hover:text-white border border-transparent hover:border-[#2a2a2a]"
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <div
                       className={`w-1.5 h-1.5 rounded-full ${
                         selectedCollection === col
                           ? "bg-[#0ea5e9]"
                           : "bg-[#666666] group-hover:bg-[#888888]"
                       }`}
                     ></div>
                     <span className="font-medium truncate">{col}</span>
                     {selectedCollection === col && (
                       <svg
                         className="w-3 h-3 text-[#0ea5e9] ml-auto"
                         fill="none"
                         stroke="currentColor"
                         viewBox="0 0 24 24"
                       >
                         <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M5 13l4 4L19 7"
                         />
                       </svg>
                     )}
                   </div>
                 </button>
               </li>
             ))}
           </ul>
         )}
       </div>
     </div>


     {/* Footer */}
     <div className="p-3 border-t border-[#1a1a1a]">
       <div className="text-xs text-[#666666] text-center">
         <div className="flex items-center justify-center gap-2 mb-1">
           <div
             className={`w-1.5 h-1.5 rounded-full ${
               dbConfig.shouldConnect ? "bg-[#10b981]" : "bg-[#666666]"
             }`}
           ></div>
           <p>{dbConfig.shouldConnect ? "Connected" : "Not Connected"}</p>
         </div>
         <p>
           {collections.length} collection{collections.length !== 1 ? "s" : ""}{" "}
           available
         </p>
       </div>
     </div>
   </aside>
 );
}