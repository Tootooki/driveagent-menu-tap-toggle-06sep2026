import {chatViewportInsets} from './chat-viewport.mjs?v=74';
import {CHAT_STORAGE_KEY,createChatState,activeChat,ensureProductChat,appendChatMessage,sortedChats,savedChats,localChatReply} from './chat-model.mjs?v=115';

const byId=id=>document.getElementById(id);
const widget=byId('chat-widget'),panel=byId('chat-popup'),launcher=byId('chat-launcher'),menu=byId('menu-backdrop'),shell=document.querySelector('.workbook-shell');
const input=byId('chat-input'),messages=byId('chat-messages'),submit=byId('chat-submit'),rooms=byId('chat-rooms'),conversation=byId('chat-conversation');
let restored;try{restored=JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY));}catch{}
const state=createChatState(restored),timers=new Set();let opener=launcher;
const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const room=()=>activeChat(state);
const persist=()=>{try{localStorage.setItem(CHAT_STORAGE_KEY,JSON.stringify(savedChats(state)));}catch{byId('chat-status').textContent='Saved for this visit only.';}};
const scrollEnd=()=>{messages.scrollTop=messages.scrollHeight;};
function renderRooms(){
  rooms.replaceChildren();
  for(const item of sortedChats(state)){
    const button=element('button','room-button');button.type='button';button.dataset.chatId=item.id;button.setAttribute('aria-label',item.title+(item.unread?` · ${item.unread} unread`:''));
    if(item.id===state.active)button.setAttribute('aria-current','page');
    button.append(element('span','room-avatar',item.sku?item.title.slice(0,2).toUpperCase():'•••'));
    const copy=element('span','room-copy');copy.append(element('strong','',item.title),element('span','room-preview',item.draft?'Draft: '+item.draft:item.messages.at(-1)?.text||'Start a conversation'));button.append(copy);
    if(item.unread)button.append(element('span','room-unread',String(item.unread)));
    button.addEventListener('click',()=>selectRoom(item.id));rooms.append(button);
  }
}
function setRoomsOpen(open){
  rooms.hidden=!open;conversation.hidden=open;panel.dataset.rooms=open?'open':'closed';
  const toggle=byId('chat-rooms-toggle');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Back to conversation':'Show conversation list');
  byId('chat-title').textContent=open?'CHATS':room().title;byId('chat-notice').textContent=open?'ON THIS DEVICE':'LOCAL DEMO';
  if(open){renderRooms();if(conversation.contains(document.activeElement))document.activeElement.blur();}
}
function refreshComposer(){
  room().draft=input.value;submit.disabled=!input.value.trim();input.style.height='44px';input.style.height=Math.min(88,Math.max(44,input.scrollHeight))+'px';
}
function renderMessages(){
  messages.replaceChildren();messages.setAttribute('aria-label',room().title+' messages');
  if(!room().messages.length){
    const empty=element('div','chat-empty');empty.append(element('p','','Start the conversation.'),element('p','','Messages stay on this device.'));messages.append(empty);return;
  }
  for(const item of room().messages){
    const article=element('article','chat-message'+(item.role==='user'?' from-user':''));article.setAttribute('aria-label',item.role==='user'?'You':'Demo reply');article.append(element('p','',item.text));
    const time=element('time','message-time',new Date(item.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false}));time.dateTime=new Date(item.time).toISOString();article.append(time);messages.append(article);
  }
}
function selectRoom(id){
  if(!state.rooms.some(item=>item.id===id))return;
  room().draft=input.value;state.active=id;room().unread=0;input.value=room().draft;
  byId('chat-status').textContent='';setRoomsOpen(false);renderRooms();renderMessages();refreshComposer();persist();scrollEnd();
}
function updateViewport(){
  if(panel.hidden)return;
  const typing=panel.contains(document.activeElement)&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  const fit=document.documentElement.hasAttribute('data-chrome-viewport')
    ? {top:0,bottom:0,short:shell.clientHeight<420,keyboard:document.documentElement.getAttribute('data-chrome-keyboard')==='true'}
    : chatViewportInsets({shell:shell.getBoundingClientRect(),viewport:window.visualViewport,typing,wasKeyboard:widget.dataset.keyboard==='true'});
  widget.style.setProperty('--chat-keyboard-inset',fit.bottom+'px');widget.style.setProperty('--chat-keyboard-top',fit.top+'px');widget.dataset.short=String(fit.short);widget.dataset.keyboard=String(fit.keyboard);
}
function closeChat({restoreFocus=true}={}){
  const wasOpen=!panel.hidden;room().draft=input.value;persist();panel.hidden=true;widget.dataset.open='false';widget.dataset.keyboard='false';widget.style.setProperty('--chat-keyboard-inset','0px');widget.style.setProperty('--chat-keyboard-top','0px');launcher.setAttribute('aria-expanded','false');
  if(panel.contains(document.activeElement))document.activeElement.blur();
  if(wasOpen&&restoreFocus)(opener?.isConnected&&!opener.closest('[hidden]')?opener:launcher).focus({preventScroll:true});
}
function openChat(id='main',source=launcher){
  if(!menu.hidden)return;opener=source;panel.hidden=false;widget.dataset.open='true';launcher.setAttribute('aria-expanded','true');selectRoom(id);updateViewport();panel.focus({preventScroll:true});
}
launcher.addEventListener('click',()=>openChat('main'));
byId('chat-close').addEventListener('click',()=>closeChat());
byId('chat-rooms-toggle').addEventListener('click',()=>setRoomsOpen(panel.dataset.rooms!=='open'));
input.addEventListener('input',()=>{refreshComposer();persist();});
byId('chat-form').addEventListener('submit',event=>{
  event.preventDefault();if(panel.hidden||conversation.hidden||!input.value.trim())return;
  const id=state.active;appendChatMessage(state,id,'user',input.value);input.value='';refreshComposer();renderMessages();renderRooms();persist();scrollEnd();
  const target=room();const timer=setTimeout(()=>{timers.delete(timer);appendChatMessage(state,id,'assistant',localChatReply(target));renderRooms();if(state.active===id){renderMessages();scrollEnd();}persist();},450);timers.add(timer);input.focus({preventScroll:true});
});
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();byId('chat-form').requestSubmit();}});
document.addEventListener('dolce:product-chat',event=>{const target=ensureProductChat(state,event.detail);if(target)openChat(target.id,event.detail.opener);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();if(panel.dataset.rooms==='open'){setRoomsOpen(false);byId('chat-rooms-toggle').focus({preventScroll:true});}else closeChat();}});
function syncMenu(){const open=!menu.hidden;if(open&&!panel.hidden)closeChat({restoreFocus:false});launcher.hidden=open;}
new MutationObserver(syncMenu).observe(menu,{attributes:true,attributeFilter:['hidden']});
byId('header-home').addEventListener('click',()=>closeChat({restoreFocus:false}));
document.addEventListener('dolce:ppc-controls-change',event=>{if(event.detail.open)closeChat({restoreFocus:false});});
panel.addEventListener('focusin',updateViewport);panel.addEventListener('focusout',()=>requestAnimationFrame(updateViewport));
window.addEventListener('pageshow',updateViewport);window.addEventListener('resize',updateViewport,{passive:true});window.addEventListener('dolce:viewportchange',updateViewport);
window.visualViewport?.addEventListener('resize',updateViewport,{passive:true});window.visualViewport?.addEventListener('scroll',updateViewport,{passive:true});
window.addEventListener('pagehide',event=>{persist();if(!event.persisted)for(const timer of timers)clearTimeout(timer);});
input.value=room().draft;renderRooms();renderMessages();refreshComposer();syncMenu();
