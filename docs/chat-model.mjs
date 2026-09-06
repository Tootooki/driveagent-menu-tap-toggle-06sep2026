// Local conversation state. Product identity always uses the original SKU.
export const CHAT_STORAGE_KEY='driveagent:product-chats:v1';
const clean=(value,max=2000)=>typeof value==='string'?value.slice(0,max):'';
const newRoom=(id,title,sku='',now=Date.now())=>({id,title,sku,messages:[],draft:'',unread:0,updatedAt:now});
export function createChatState(saved){
  const state={active:'main',rooms:[newRoom('main','MAIN CHAT')]};
  if(saved?.version!==1||!Array.isArray(saved.rooms))return state;
  const seen=new Set();
  for(const item of saved.rooms.slice(0,200)){
    const sku=clean(item?.sku,100),id=sku?'product:'+sku:'main';
    if(!item||item.id!==id||seen.has(id))continue;seen.add(id);
    const room=newRoom(id,sku?clean(item.title,100)||sku:'MAIN CHAT',sku,Number(item.updatedAt)||0);
    room.draft=clean(item.draft);room.unread=Math.max(0,Math.min(999,Number(item.unread)||0));
    room.messages=(Array.isArray(item.messages)?item.messages:[]).slice(-200).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string').map(m=>({role:m.role,text:clean(m.text),time:Number(m.time)||0}));
    if(id==='main')state.rooms[0]=room;else state.rooms.push(room);
  }
  return state;
}
export const activeChat=state=>state.rooms.find(room=>room.id===state.active)||state.rooms[0];
export function ensureProductChat(state,product,now=Date.now()){
  const sku=clean(product?.sku,100).trim();if(!sku)return null;
  const id='product:'+sku;let room=state.rooms.find(item=>item.id===id);
  if(!room){room=newRoom(id,clean(product.title,100)||sku,sku,now);state.rooms.push(room);}
  return room;
}
export function appendChatMessage(state,id,role,text,now=Date.now()){
  const room=state.rooms.find(item=>item.id===id),value=clean(text).trim();
  if(!room||!value||!['user','assistant'].includes(role))return null;
  const message={role,text:value,time:now};room.messages.push(message);room.updatedAt=now;
  if(role==='assistant'&&state.active!==id)room.unread++;
  return message;
}
export function sortedChats(state){return [...state.rooms].sort((a,b)=>a.id==='main'?-1:b.id==='main'?1:b.updatedAt-a.updatedAt);}
export function savedChats(state){return {version:1,rooms:state.rooms};}
export function localChatReply(room){return `Message saved in ${room.sku?room.title:'Main chat'}. Live AI isn’t connected in this demo yet.`;}
