import ProfileMenu from "./ProfileMenu";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import { useEffect, useRef, useState } from "react";
import ChatInputBar from "./ChatInputBar";


export default function MainPanel({
 query,
 setQuery,
 handleAsk,
 conversation,
 loading,
 selectedCollection,
 dbConfig,
 user,
 onLogout,
 isOpen,
 toggleSidebar,
 savedLlmConfigs,
 selectedLlmConfig,
 onSelectLlmConfig,
 needsApiKeySetup,
 promptSuggestions,
 suggestionsLoading,
}) {
 const [showSuggestions, setShowSuggestions] = useState(false);
 const prevCollectionRef = useRef();
 const messagesEndRef = useRef(null);
 const hasConversation = conversation.length > 0;
 const isConnected = dbConfig.shouldConnect && dbConfig.dbUri && dbConfig.dbName;


 // Show suggestions when collection changes
 useEffect(() => {
   if (selectedCollection && prevCollectionRef.current !== selectedCollection) {
     setShowSuggestions(true);
     prevCollectionRef.current = selectedCollection;
   }
 }, [selectedCollection]);


 // Hide suggestions if user starts typing
 useEffect(() => {
   if (query) setShowSuggestions(false);
 }, [query]);


 const handleSuggestionClick = (suggestion) => {
   setQuery(suggestion);
   setShowSuggestions(false);
 };


 const scrollToBottom = () => {
   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 };


 useEffect(() => {
   scrollToBottom();
 }, [conversation]);


 // Show API key setup prompt if needed
 if (needsApiKeySetup) {
   return (
     <main className="flex-1 flex flex-col h-screen bg-[#0a0a0a]">
       {/* Header */}
       <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
         <div className="flex items-center gap-3">
           <button
             onClick={toggleSidebar}
             className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
           >
             <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
             </svg>
           </button>
           <h1 className="text-lg font-semibold text-white">MongoAI Chat</h1>
         </div>
         <ProfileMenu user={user} onLogout={onLogout} />
       </div>


       {/* API Key Setup Message */}
       <div className="flex-1 flex items-center justify-center p-6">
         <div className="max-w-md text-center space-y-4">
           <div className="w-16 h-16 mx-auto bg-[#1a1a1a] rounded-full flex items-center justify-center">
             <svg className="w-8 h-8 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
           </div>
           <h2 className="text-xl font-semibold text-white">Welcome to MongoAI!</h2>
           <p className="text-[#888888] text-sm leading-relaxed">
             To get started, you'll need to configure at least one AI model API key.
             This allows you to ask questions about your MongoDB data using AI.
           </p>
           <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
             <p className="text-[#cccccc] text-sm">
               <strong>Next steps:</strong>
             </p>
             <ol className="text-[#888888] text-sm mt-2 space-y-1 text-left">
               <li>1. Click the sidebar menu to open settings</li>
               <li>2. Go to "Model Configuration"</li>
               <li>3. Add your API key for OpenAI, Anthropic, or other providers</li>
               <li>4. Configure your MongoDB connection</li>
               <li>5. Start chatting with your data!</li>
             </ol>
           </div>
         </div>
       </div>
     </main>
   );
 }


 return (
   <main className="flex-1 flex flex-col relative bg-[#0a0a0a]">
     {/* Header */}
     <div className="relative z-10 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-sm">
       <div className="mx-auto px-2 py-4">
         <div className="flex items-start justify-between">
           {!isOpen && (
             <button
               onClick={toggleSidebar}
               className="p-2 rounded hover:bg-[#1a1a1a]"
               title="Expand Sidebar"
             >
               <svg
                 className="w-6 h-6 text-white"
                 fill="none"
                 stroke="currentColor"
                 viewBox="0 0 24 24"
               >
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={1.5}
                   d="M4 6h16M4 12h16M4 18h16"
                 />
               </svg>
             </button>
           )}
           <div>
             <h1 className="text-xl font-medium text-white">
               Prompt your way to insights
             </h1>
             {selectedCollection && (
               <p className="text-sm text-[#888888] mt-1">
                 Connected to:{" "}
                 <span className="text-[#0ea5e9] font-medium">
                   {selectedCollection}
                 </span>
               </p>
             )}
           </div>
           <div>
             {/* Profile Section */}
             <ProfileMenu userData={user} onLogout={onLogout} />
           </div>
         </div>
       </div>
     </div>


     {/* Main Content */}
     <div className="flex-1 overflow-y-auto">
       <div className="max-w-4xl mx-auto px-6 py-8">
         {!hasConversation ? (
           // Welcome State
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
             <div className="mb-8">
               <div className="w-16 h-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                 <svg
                   className="w-8 h-8 text-[#888888]"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={1.5}
                     d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                   />
                 </svg>
               </div>
               <h2 className="text-2xl font-medium text-white mb-3">
                 What can I help you discover?
               </h2>
               <p className="text-[#888888] text-base max-w-md mx-auto leading-relaxed">
                 Ask questions about your data and get intelligent insights
                 powered by AI.
               </p>
             </div>


             {!isConnected && (
               <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-4 mb-8 max-w-md">
                 <p className="text-[#f59e0b] text-sm">
                   Please enter MongoDB connection details in the sidebar to
                   get started.
                 </p>
               </div>
             )}


             {isConnected && !selectedCollection && (
               <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-4 mb-8 max-w-md">
                 <p className="text-[#f59e0b] text-sm">
                   Please select a collection from the sidebar to get started.
                 </p>
               </div>
             )}


             {/* Example queries */}
             {isConnected && selectedCollection && (
               <div className="mt-8 max-w-2xl">
                 <h3 className="text-[#888888] text-sm font-medium mb-4">
                   Try asking questions like:
                 </h3>
                 <div className="grid gap-3">
                   {promptSuggestions.length > 0 ? (
                     promptSuggestions.map((example, i) => (
                       <button
                         key={i}
                         onClick={() => setQuery(example)}
                         className="text-left p-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors"
                       >
                         <p className="text-[#cccccc] text-sm">{example}</p>
                       </button>
                     ))
                   ) : (
                     // Loading state while suggestions are being generated
                     Array.from({ length: 4 }, (_, i) => (
                       <div
                         key={i}
                         className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg animate-pulse"
                       >
                         <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-2"></div>
                         <div className="h-3 bg-[#2a2a2a] rounded w-1/2"></div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
             )}
           </div>
         ) : (
           // Conversation History
           <div className="space-y-8">
             {conversation.map((turn) => (
               <div key={turn.id}>
                 {turn.role === 'user' ? (
                   <UserMessage query={turn.content} user={user} />
                 ) : (
                   <AssistantMessage data={turn.content} />
                 )}
               </div>
             ))}
             <div ref={messagesEndRef} />
           </div>
         )}
       </div>
     </div>


     {/* Floating Suggestions (only when showSuggestions is true, and not loading, and there are suggestions) */}
     {showSuggestions && !suggestionsLoading && promptSuggestions.length > 0 && !query && (
       <div className="fixed left-1/2 bottom-28 z-30 -translate-x-1/2 flex flex-wrap gap-2 max-w-2xl w-full justify-center pointer-events-none">
         {promptSuggestions.map((example, i) => (
           <button
             key={i}
             onClick={() => handleSuggestionClick(example)}
             className="pointer-events-auto px-4 py-2 bg-[#232323] hover:bg-[#0ea5e9] text-[#cccccc] hover:text-white border border-[#2a2a2a] rounded-lg shadow transition-colors text-sm"
           >
             {example}
           </button>
         ))}
       </div>
     )}


     {/* Input */}
     <div className="border-t border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-sm">
       <div className="max-w-4xl mx-auto px-6 py-4">
         <ChatInputBar
           savedLlmConfigs={savedLlmConfigs}
           selectedLlmConfig={selectedLlmConfig}
           onSelectLlmConfig={onSelectLlmConfig}
           query={query}
           setQuery={setQuery}
           handleAsk={handleAsk}
           loading={loading}
           disabled={!isConnected || !selectedCollection}
           placeholder={
             !isConnected
               ? "Enter MongoDB connection details to start..."
               : "Ask a question..."
           }
         />
       </div>
     </div>
   </main>
 );
}