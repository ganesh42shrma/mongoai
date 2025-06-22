export default function UserMessage({ query, user }) {
 const getAvatarUrl = () => {
   return user?.user_metadata?.avatar_url ||
     `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || user?.email?.split('@')[0] || "U"}&background=0a0a0a&color=fff`;
 };


 return (
   <div className="flex items-start gap-4">
     <img
       src={getAvatarUrl()}
       alt="User avatar"
       className="w-8 h-8 rounded-full border border-[#333]"
     />
     <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
       <p className="text-white text-sm whitespace-pre-wrap">{query}</p>
     </div>
   </div>
 );
}