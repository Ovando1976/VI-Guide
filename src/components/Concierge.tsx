import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { User } from 'firebase/auth';
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { ChatMessage, BeachDoc, PlaceDoc, EventDoc, IslandCode, UserProfile } from '../types';
import { MapPin, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

type Listing = BeachDoc | PlaceDoc;
type Event = EventDoc;

import { AGENT_REGISTRY } from '../lib/agents/registry';
import { AgentConfig } from '../lib/agents/types';

import { resolveEstateContext, getTerritoryIntelligence } from '../lib/usvi/geography';
import { getUserMemories, saveMemory } from '../lib/firestore/memory';
import { getPostsByIsland } from '../lib/firestore/community';
import { getTransitRoutes } from '../lib/firestore/transit';

export default function Concierge({ 
  user, 
  profile,
  contextListing,
  userLocation,
  onSelectListing,
  agentId = 'concierge',
  initialPrompt,
}: { 
  user: User | null;
  profile?: UserProfile | null;
  contextListing?: Listing | null;
  userLocation?: { lat: number; lng: number } | null;
  onSelectListing?: (listing: Listing) => void;
  agentId?: string;
  initialPrompt?: string;
}) {
  const agent = AGENT_REGISTRY[agentId] || AGENT_REGISTRY.concierge;
  const location = useLocation();
  const parcelContext = (location.state as any)?.parcelContext as
    | { parcelId: string; label: string; island: string; estateName?: string | null; address?: string | null }
    | undefined;
  const [messages, setMessages] = useState<{ 
    role: 'user' | 'model', 
    text: string, 
    listings?: Listing[], 
    events?: Event[],
    posts?: any[],
    routes?: any[]
  }[]>([
    { role: 'model', text: agentId === 'operator' 
      ? "Operator Assistant online. Ready for territory-scale intelligence and logistics support." 
      : "Hi! I'm your VI Explorer concierge. Looking for the best beach, a hidden dining gem, or need help with transit in the US Virgin Islands? Ask me anything!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getUserMemories(user.uid).then(setMemories);
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!initialPrompt) return;
    setInput(initialPrompt);
  }, [initialPrompt]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const searchListings = async (args: { category?: string, query?: string, islandCode?: IslandCode, estate?: string }) => {
        const results: Listing[] = [];
        const island = args.islandCode || 'st_thomas';

        // Check for estate context
        let estateFilter = args.estate;
        if (args.query && !estateFilter) {
          const context = resolveEstateContext(args.query, island);
          if (context) estateFilter = context.estate;
        }

        // Search beaches
        const beachesRef = collection(db, 'beaches');
        let qBeaches = query(beachesRef, where('islandCode', '==', island), limit(10));
        const beachSnapshot = await getDocs(qBeaches);
        results.push(...beachSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BeachDoc)));

        // Search places
        const placesRef = collection(db, 'places');
        let qPlaces = query(placesRef, where('islandCode', '==', island), limit(10));
        if (args.category && args.category !== 'all') {
          qPlaces = query(placesRef, where('islandCode', '==', island), where('category', '==', args.category), limit(10));
        }
        const placeSnapshot = await getDocs(qPlaces);
        results.push(...placeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaceDoc)));
        
        let filtered = results;
        if (estateFilter) {
          filtered = filtered.filter(l => 
            ('address' in l && l.address.toLowerCase().includes(estateFilter!.toLowerCase())) ||
            ('description' in l && l.description.toLowerCase().includes(estateFilter!.toLowerCase()))
          );
        }

        if (args.query) {
          const q = args.query.toLowerCase();
          filtered = filtered.filter(l => 
            l.title.toLowerCase().includes(q) || 
            l.description.toLowerCase().includes(q)
          );
        }
        return filtered.slice(0, 5);
      };

      const searchEvents = async (args: { query?: string, islandCode?: IslandCode }) => {
        const eventsRef = collection(db, 'events');
        const island = args.islandCode || 'st_thomas';
        let q = query(eventsRef, where('islandCode', '==', island), where('status', '==', 'published'), limit(5));
        
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventDoc));
        
        if (args.query) {
          const q = args.query.toLowerCase();
          return results.filter(e => 
            e.title.toLowerCase().includes(q) || 
            e.description.toLowerCase().includes(q)
          );
        }
        return results;
      };

      const searchCommunity = async (args: { islandCode?: IslandCode }) => {
        const island = args.islandCode || 'st_thomas';
        return await getPostsByIsland(island);
      };

      const getTransitInfo = async (args: { islandCode?: IslandCode }) => {
        const island = args.islandCode || 'st_thomas';
        return await getTransitRoutes(island);
      };

      const getFavorites = async () => {
        if (!profile?.favorites || profile.favorites.length === 0) return [];
        
        const favs: Listing[] = [];
        const beachesRef = collection(db, 'beaches');
        const qBeaches = query(beachesRef, where('slug', 'in', profile.favorites));
        const beachSnap = await getDocs(qBeaches);
        favs.push(...beachSnap.docs.map(d => ({ id: d.id, ...d.data() } as BeachDoc)));

        const placesRef = collection(db, 'places');
        const qPlaces = query(placesRef, where('slug', 'in', profile.favorites));
        const placeSnap = await getDocs(qPlaces);
        favs.push(...placeSnap.docs.map(d => ({ id: d.id, ...d.data() } as PlaceDoc)));
        
        return favs;
      };

      const getWeather = async (args: { islandCode?: IslandCode }) => {
        const island = args.islandCode || 'st_thomas';
        // Mock weather data for USVI
        const weatherData: Record<string, any> = {
          'st_thomas': { temp: 84, condition: 'Sunny', humidity: '72%', wind: '12mph E' },
          'st_john': { temp: 83, condition: 'Partly Cloudy', humidity: '70%', wind: '10mph E' },
          'st_croix': { temp: 85, condition: 'Clear', humidity: '68%', wind: '15mph E' },
          'water_island': { temp: 84, condition: 'Sunny', humidity: '72%', wind: '12mph E' }
        };
        return weatherData[island] || weatherData['st_thomas'];
      };

      const getTerritoryStats = async (args: { islandCode?: IslandCode }) => {
        const island = args.islandCode || 'st_thomas';
        return {
          island,
          activeListings: 145,
          upcomingEvents: 12,
          transitStatus: 'Normal',
          topEstate: 'Peterborg'
        };
      };

      const remember = async (args: { key: string, value: any, importance?: number }) => {
        if (user) {
          await saveMemory(user.uid, args.key, args.value, args.importance || 5);
          return { status: 'remembered' };
        }
        return { status: 'no_user' };
      };

      let contextPrompt = "";
      if (contextListing) {
        const category = 'category' in contextListing ? contextListing.category : 'Beach';
        const address = 'address' in contextListing ? contextListing.address : 'St. Thomas, USVI';
        contextPrompt += `The user is currently viewing a listing for "${contextListing.title}" in the ${category} category. Its address is ${address}. `;
      }
      if (userLocation) {
        contextPrompt += `The user's current location is approximately ${userLocation.lat}, ${userLocation.lng}. `;
      }
      if (profile?.favorites && profile.favorites.length > 0) {
        contextPrompt += `The user has ${profile.favorites.length} saved places in their favorites. `;
      }
      if (memories.length > 0) {
        contextPrompt += `Past user preferences/memories: ${memories.map(m => `${m.key}: ${JSON.stringify(m.value)}`).join(', ')}. `;
      }
      if (parcelContext) {
        contextPrompt += `The user selected parcel ${parcelContext.parcelId} (${parcelContext.label}) on ${parcelContext.island.toUpperCase()} in ${parcelContext.estateName || 'an unknown estate'}. `;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: `${agent.systemInstruction}
          
          ${contextPrompt}
          User says: ${userMessage}` }] }
        ],
        config: {
          systemInstruction: agent.systemInstruction,
          tools: [
            { googleSearch: {} },
            {
              functionDeclarations: [
                ...(agent.tools?.functionDeclarations || []),
                {
                  name: 'remember',
                  description: 'Save a user preference or fact to long-term memory',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING, description: 'The key for the memory (e.g. preferred_island)' },
                      value: { type: Type.STRING, description: 'The value to remember' },
                      importance: { type: Type.NUMBER, description: 'Importance from 1-10' }
                    },
                    required: ['key', 'value']
                  }
                },
                {
                  name: 'searchCommunity',
                  description: 'Search community posts and stories from the territory',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      islandCode: { type: Type.STRING, description: 'The island code' }
                    }
                  }
                },
                {
                  name: 'getTransitInfo',
                  description: 'Get real-time transit routes and status for ferries, shuttles, etc.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      islandCode: { type: Type.STRING, description: 'The island code' }
                    }
                  }
                }
              ]
            }
          ]
        }
      });

      let text = response.text || "";
      let foundListings: Listing[] = [];
      let foundEvents: Event[] = [];
      let foundPosts: any[] = [];
      let foundRoutes: any[] = [];
      
      // Handle function calls
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          let result: any;
          if (call.name === 'searchListings') {
            result = await searchListings(call.args as any);
            foundListings = result;
          } else if (call.name === 'searchEvents') {
            result = await searchEvents(call.args as any);
            foundEvents = result;
          } else if (call.name === 'getFavorites') {
            result = await getFavorites();
            foundListings = result;
          } else if (call.name === 'getWeather') {
            result = await getWeather(call.args as any);
          } else if (call.name === 'getTerritoryStats') {
            result = await getTerritoryStats(call.args as any);
          } else if (call.name === 'remember') {
            result = await remember(call.args as any);
          } else if (call.name === 'searchCommunity') {
            result = await searchCommunity(call.args as any);
            foundPosts = result;
          } else if (call.name === 'getTransitInfo') {
            result = await getTransitInfo(call.args as any);
            foundRoutes = result;
          }

          if (result) {
            const toolResponse = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [
                { role: 'user', parts: [{ text: userMessage }] },
                { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result } } }] }
              ],
              config: {
                systemInstruction: "You are the VI Explorer Concierge. Use the provided tool results to give a helpful recommendation. Be specific and friendly."
              }
            });
            text = toolResponse.text || "I found some information for you!";
          }
        }
      }

      if (!text) text = "I'm sorry, I couldn't process that request.";
      
      // Extract grounding URLs if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        const links = chunks
          .filter(c => c.web)
          .map(c => `* [${c.web?.title}](${c.web?.uri})`)
          .join('\n');
        if (links) {
          text += `\n\n**Sources:**\n${links}`;
        }
      }
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text, 
        listings: foundListings, 
        events: foundEvents,
        posts: foundPosts,
        routes: foundRoutes
      }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to my local knowledge base right now. Please try again in a moment!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-sand">
      {/* Chat Header */}
      <div className="p-8 border-b border-stone-100 flex items-center gap-6 bg-white/40 backdrop-blur-3xl sticky top-0 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-turquoise/20 rounded-2xl blur-xl animate-pulse" />
          <div className="w-16 h-16 bg-ink rounded-2xl flex items-center justify-center text-turquoise shadow-2xl relative z-10">
            <Sparkles size={32} />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-serif italic text-ink">Island Concierge</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-turquoise rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-turquoise rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-turquoise rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <p className="micro-label text-turquoise">Processing Intelligence</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar"
      >
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={cn(
              "flex gap-6 max-w-[95%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl transition-all",
              msg.role === 'user' ? "bg-white text-ink" : "bg-ink text-turquoise"
            )}>
              {msg.role === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
            </div>
            <div className={cn(
              "p-8 rounded-[2.5rem] text-base leading-relaxed space-y-8 shadow-2xl shadow-stone-200/40 relative",
              msg.role === 'user' ? "bg-ink text-white rounded-tr-none" : "bg-white text-ink rounded-tl-none"
            )}>
              <div className={cn(
                "markdown-body prose prose-sm max-w-none",
                msg.role === 'user' ? "prose-invert" : "prose-stone"
              )}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {msg.listings && msg.listings.length > 0 && (
                <div className="space-y-3 pt-2">
                  {msg.listings.map(listing => (
                    <div 
                      key={listing.id}
                      onClick={() => onSelectListing?.(listing)}
                      className="bg-sand/50 p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white hover:shadow-xl transition-all border border-stone-100 group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-inner">
                        <img 
                          src={listing.coverImage || `https://picsum.photos/seed/${listing.title}/100/100`} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-base font-serif italic text-ink truncate">{listing.title}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                          <MapPin size={12} className="text-turquoise" />
                          <span className="truncate">{(listing as PlaceDoc).address || (listing as BeachDoc).areaSlug || 'USVI'}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-stone-200 group-hover:text-turquoise transition-colors" />
                    </div>
                  ))}
                </div>
              )}

              {msg.events && msg.events.length > 0 && (
                <div className="space-y-3 pt-2">
                  {msg.events.map(event => (
                    <div 
                      key={event.id}
                      className="bg-sand/50 p-3 rounded-2xl flex items-center gap-4 border border-stone-100 group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-inner">
                        <img 
                          src={event.coverImage} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-base font-serif italic text-ink truncate">{event.title}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                          <CalendarIcon size={12} className="text-turquoise" />
                          <span className="truncate">{format(new Date(event.startAt), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {msg.posts && msg.posts.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Community Stories</p>
                  {msg.posts.map(post => (
                    <div key={post.id} className="bg-sand/50 p-4 rounded-2xl border border-stone-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg overflow-hidden">
                          <img src={post.userPhoto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[10px] font-bold text-ink">{post.userName}</span>
                      </div>
                      <p className="text-xs italic font-serif text-stone-600">"{post.content}"</p>
                    </div>
                  ))}
                </div>
              )}

              {msg.routes && msg.routes.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Transit Status</p>
                  {msg.routes.map(route => (
                    <div key={route.id} className="bg-sand/50 p-4 rounded-2xl border border-stone-100 flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-ink">{route.name}</h5>
                        <p className="text-[9px] text-stone-400 uppercase tracking-widest">{route.from} → {route.to}</p>
                      </div>
                      <span className={cn(
                        "text-[8px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest",
                        route.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {route.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-6 mr-auto max-w-[90%]">
            <div className="w-12 h-12 rounded-2xl bg-ink text-turquoise flex items-center justify-center shadow-xl">
              <Bot size={20} />
            </div>
            <div className="bg-white p-6 rounded-[2rem] rounded-tl-none flex gap-2 shadow-2xl shadow-stone-200/40">
              <span className="w-2 h-2 bg-turquoise rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-turquoise rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-turquoise rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-8 bg-white/40 backdrop-blur-3xl border-t border-stone-100">
        <div className="relative flex items-center gap-6 max-w-4xl mx-auto">
          <input 
            type="text" 
            placeholder="Ask about beaches, food, transit..." 
            className="flex-1 bg-white border border-stone-100 rounded-[2rem] px-8 py-5 text-base focus:ring-8 focus:ring-turquoise/10 outline-none shadow-2xl shadow-stone-200/40 font-serif italic"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-16 h-16 bg-ink text-white rounded-2xl flex items-center justify-center disabled:opacity-50 transition-all hover:bg-ocean active:scale-95 shadow-2xl shadow-ink/20 group"
          >
            <Send size={24} className="text-turquoise group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
