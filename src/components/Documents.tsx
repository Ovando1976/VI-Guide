import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, AIDocument, DocumentType } from '../types';
import { getUserDocuments, createDocument, updateDocumentContent, shareDocument } from '../lib/firestore/documents';
import { FileText, Plus, Search, MoreVertical, Sparkles, Save, Share2, Trash2, ChevronRight, Clock, Eye, Edit3, X, Check, MapPin, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { resolveEstateContext, getTerritoryIntelligence } from '../lib/usvi/geography';

const TEMPLATES: { title: string; type: DocumentType; content: string; description: string }[] = [
  { 
    title: 'CZM Permit Application Draft', 
    type: 'report', 
    description: 'Standard Coastal Zone Management draft for USVI projects.',
    content: '# CZM Permit Application Draft\n\n## 1. Project Overview\n[Describe the project location and scope]\n\n## 2. Environmental Impact\n[Detail the impact on local flora and fauna]\n\n## 3. Coastal Resources\n[Analyze impact on shoreline and reefs]'
  },
  { 
    title: 'Island Business Proposal', 
    type: 'proposal', 
    description: 'Professional proposal for local USVI business ventures.',
    content: '# Business Proposal\n\n## Executive Summary\n[Summary of the business concept]\n\n## Market Analysis\n[USVI specific market data and target audience]\n\n## Operational Plan\n[Logistics, staffing, and island-specific requirements]'
  },
  { 
    title: 'Territory Event Itinerary', 
    type: 'itinerary', 
    description: 'Detailed logistics for multi-island events or tours.',
    content: '# Event Itinerary\n\n## Day 1: St. Thomas\n- Morning: [Activity]\n- Afternoon: [Activity]\n- Evening: [Activity]\n\n## Day 2: St. John\n- Ferry Departure: [Time]\n- Morning: [Activity]'
  }
];

export default function Documents({ 
  user, 
  profile,
  initialDocument,
  onClearInitial
}: { 
  user: User | null;
  profile?: UserProfile | null;
  initialDocument?: AIDocument | null;
  onClearInitial?: () => void;
}) {
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<AIDocument | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (initialDocument) {
      setSelectedDoc(initialDocument);
      setEditContent(initialDocument.content);
      setEditTitle(initialDocument.title);
      setViewMode('edit');
      onClearInitial?.();
    }
  }, [initialDocument]);

  useEffect(() => {
    if (user) {
      const fetchDocs = async () => {
        const docs = await getUserDocuments(user.uid);
        setDocuments(docs);
      };
      fetchDocs();
    }
  }, [user]);

  const handleCreate = async (type: DocumentType = 'draft', initialContent = '', initialTitle = 'Untitled Document') => {
    if (!user) return;
    setIsCreating(true);
    setShowTemplates(false);
    try {
      const newDocId = await createDocument({
        title: initialTitle,
        content: initialContent,
        type,
        userId: user.uid,
        tags: []
      });
      const newDoc: AIDocument = {
        id: newDocId,
        title: initialTitle,
        content: initialContent,
        type,
        userId: user.uid,
        tags: [],
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setDocuments([newDoc, ...documents]);
      setSelectedDoc(newDoc);
      setEditContent(initialContent);
      setEditTitle(initialTitle);
      setViewMode('edit');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDoc) return;
    await updateDocumentContent(selectedDoc.id, editContent, editTitle);
    setDocuments(documents.map(d => d.id === selectedDoc.id ? { ...d, content: editContent, title: editTitle, updatedAt: Date.now() } : d));
    setSelectedDoc({ ...selectedDoc, content: editContent, title: editTitle, updatedAt: Date.now() });
  };

  const handleShare = async () => {
    if (!selectedDoc || !shareEmail) return;
    const currentShared = selectedDoc.sharedWith || [];
    if (!currentShared.includes(shareEmail)) {
      const newShared = [...currentShared, shareEmail];
      await shareDocument(selectedDoc.id, newShared);
      setSelectedDoc({ ...selectedDoc, sharedWith: newShared });
      setShareEmail('');
      setShowShareModal(false);
    }
  };

  const handleAiAssist = async (prompt: string) => {
    if (!user || isAiWorking) return;
    setIsAiWorking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Enhance context with territory intelligence
      const island = selectedDoc?.islandCode || 'st_thomas';
      const stats = getTerritoryIntelligence(island);
      const estateContext = resolveEstateContext(editContent, island);
      
      const contextStr = `
        Territory Context: ${island}
        Active Listings: ${stats.activeListings}
        Upcoming Events: ${stats.upcomingEvents}
        Estate Context: ${estateContext?.estate || 'None detected'}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: `You are the VI Territory OS AI Assistant. Help me with this document.
          
          ${contextStr}
          
          Document Title: ${editTitle}
          Current Content: ${editContent}
          
          User Request: ${prompt}
          
          Please provide the updated content in Markdown format. Be professional and grounded in USVI local context.` }] }
        ],
        config: {
          systemInstruction: "You are a professional territory-scale intelligence assistant for the US Virgin Islands. Help users draft reports, proposals, and operational documents."
        }
      });
      
      const newContent = response.text || '';
      setEditContent(newContent);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsAiWorking(false);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center text-stone-300">
          <FileText size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif italic text-ink">Sign in to collaborate</h2>
          <p className="text-stone-500 max-w-xs mx-auto">Create and share AI-assisted documents for your island projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-sand overflow-hidden relative">
      {/* Sidebar */}
      <div className={cn(
        "w-80 border-r border-stone-100 bg-white/50 backdrop-blur-md flex flex-col transition-all duration-500",
        selectedDoc ? "hidden md:flex" : "flex w-full md:w-80"
      )}>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-serif italic text-ink">Archive</h2>
              <p className="micro-label">Territory Intelligence</p>
            </div>
            <button 
              onClick={() => setShowTemplates(true)}
              disabled={isCreating}
              className="group relative"
            >
              <div className="absolute inset-0 bg-turquoise/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
              <div className="relative w-12 h-12 bg-ink text-turquoise rounded-xl flex items-center justify-center shadow-lg shadow-ink/20 hover:scale-105 active:scale-95 transition-all">
                <Plus size={24} />
              </div>
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-turquoise transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search archive..." 
              className="w-full bg-white/50 border border-stone-100 rounded-2xl pl-14 pr-6 py-4 text-sm outline-none focus:ring-4 focus:ring-turquoise/5 focus:bg-white transition-all font-serif italic"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-4 no-scrollbar stagger-in">
          {filteredDocs.map(doc => (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedDoc(doc);
                setEditContent(doc.content);
                setEditTitle(doc.title);
                setViewMode('edit');
              }}
              className={cn(
                "w-full p-6 rounded-[2rem] text-left transition-all group relative overflow-hidden border",
                selectedDoc?.id === doc.id 
                  ? "bg-ink text-white shadow-2xl shadow-ink/30 border-ink" 
                  : "bg-white/40 hover:bg-white text-ink border-stone-50 hover:border-stone-200 hover:shadow-xl"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-[0.2em]",
                  selectedDoc?.id === doc.id ? "bg-turquoise text-ink" : "bg-stone-100 text-stone-400"
                )}>
                  {doc.type}
                </div>
                <div className="flex items-center gap-2 text-[10px] opacity-50 font-bold tracking-tighter">
                  <Clock size={12} />
                  {format(doc.updatedAt, 'MMM d')}
                </div>
              </div>
              <h3 className="font-serif italic text-lg truncate pr-4 leading-tight">{doc.title}</h3>
              <p className={cn(
                "text-xs line-clamp-2 mt-2 opacity-60 leading-relaxed font-serif italic",
                selectedDoc?.id === doc.id ? "text-stone-300" : "text-stone-500"
              )}>
                {doc.content || 'Empty document...'}
              </p>
              
              {selectedDoc?.id === doc.id && (
                <motion.div 
                  layoutId="active-doc"
                  className="absolute left-0 top-0 bottom-0 w-1.5 bg-turquoise"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className={cn(
        "flex-1 flex flex-col bg-white transition-all duration-500",
        !selectedDoc && "hidden md:flex items-center justify-center text-stone-300"
      )}>
        {selectedDoc ? (
          <>
            {/* Editor Header */}
            <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-white/80 backdrop-blur-3xl sticky top-0 z-10">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="md:hidden w-12 h-12 bg-sand rounded-2xl flex items-center justify-center text-ink shadow-sm"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div className="space-y-1 flex-1 min-w-0">
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-3xl font-serif italic text-ink bg-transparent border-none outline-none w-full placeholder:text-stone-200"
                    placeholder="Document Title"
                  />
                  <div className="flex items-center gap-3">
                    <span className="micro-label text-turquoise">{selectedDoc.type}</span>
                    <div className="w-1 h-1 bg-stone-200 rounded-full" />
                    <span className="micro-label">Last edited {format(selectedDoc.updatedAt, 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-sand/50 p-1.5 rounded-2xl mr-4 border border-stone-100">
                  <button 
                    onClick={() => setViewMode('edit')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                      viewMode === 'edit' ? "bg-white text-ink shadow-xl" : "text-stone-400 hover:text-ink"
                    )}
                  >
                    <Edit3 size={16} />
                    Draft
                  </button>
                  <button 
                    onClick={() => setViewMode('preview')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                      viewMode === 'preview' ? "bg-white text-ink shadow-xl" : "text-stone-400 hover:text-ink"
                    )}
                  >
                    <Eye size={16} />
                    Review
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSave}
                    className="w-12 h-12 bg-sand text-ink rounded-2xl flex items-center justify-center hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-stone-100"
                    title="Save"
                  >
                    <Save size={20} />
                  </button>
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="w-12 h-12 bg-sand text-ink rounded-2xl flex items-center justify-center hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-stone-100" 
                    title="Share"
                  >
                    <Share2 size={20} />
                  </button>
                  <button className="w-12 h-12 bg-sand text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:shadow-xl transition-all border border-transparent hover:border-rose-100" title="Delete">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Main Text Area */}
              <div className="flex-1 overflow-y-auto p-10 md:p-20 no-scrollbar bg-white">
                <div className="max-w-4xl mx-auto">
                  {viewMode === 'edit' ? (
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full min-h-[70vh] bg-transparent border-none outline-none resize-none font-serif text-2xl leading-relaxed text-ink placeholder:text-stone-100 selection:bg-turquoise/20"
                      placeholder="Begin your territory intelligence report..."
                    />
                  ) : (
                    <div className="markdown-body prose prose-stone prose-xl max-w-none">
                      <ReactMarkdown>{editContent}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Sidebar (Desktop Only) */}
              <div className="hidden lg:flex w-96 border-l border-stone-100 bg-sand/20 backdrop-blur-xl flex-col p-8 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-turquoise/30 rounded-xl blur-lg animate-pulse" />
                    <div className="relative w-12 h-12 bg-ink text-turquoise rounded-xl flex items-center justify-center shadow-xl">
                      <Sparkles size={20} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-serif italic text-xl text-ink">AI Strategist</h4>
                    <p className="micro-label text-stone-400">Context: {selectedDoc.islandCode || 'Territory'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-5 bg-white/60 rounded-2xl border border-white shadow-sm space-y-3">
                    <p className="text-xs text-stone-500 leading-relaxed font-serif italic">
                      I can help you refine this {selectedDoc.type} with local USVI insights and professional formatting.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: 'Rewrite Professionally', icon: <Edit3 size={12} /> },
                      { label: 'Summarize for Executive', icon: <FileText size={12} /> },
                      { label: 'Add Estate Context', icon: <MapPin size={12} /> },
                      { label: 'Draft Proposal Outline', icon: <Plus size={12} /> }
                    ].map(suggestion => (
                      <button 
                        key={suggestion.label}
                        onClick={() => handleAiAssist(suggestion.label)}
                        disabled={isAiWorking}
                        className="w-full p-4 bg-white border border-stone-100 rounded-2xl text-left text-[10px] font-bold uppercase tracking-widest text-ink hover:border-turquoise hover:text-turquoise hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-between group"
                      >
                        {suggestion.label}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-turquoise">
                          <ChevronRight size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1" />

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-turquoise/20 to-ocean/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <textarea 
                      placeholder="Ask the strategist..."
                      className="w-full bg-white border border-stone-100 rounded-3xl p-6 text-sm outline-none focus:ring-4 focus:ring-turquoise/5 transition-all min-h-[140px] resize-none font-serif italic shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAiAssist((e.target as HTMLTextAreaElement).value);
                          (e.target as HTMLTextAreaElement).value = '';
                        }
                      }}
                    />
                    <div className="absolute right-4 bottom-4">
                      <button className="w-10 h-10 bg-ink text-turquoise rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {isAiWorking && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl gap-4">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-turquoise rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-turquoise rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-turquoise rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="micro-label text-turquoise animate-pulse">Strategizing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
            <FileText size={64} />
            <p className="font-serif italic">Select a document to begin</p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-ink">Share Document</h3>
                <button onClick={() => setShowShareModal(false)} className="text-stone-400 hover:text-ink">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Enter email address..."
                    className="w-full bg-sand border border-stone-100 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-turquoise/10 transition-all font-serif italic"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                  />
                  <button 
                    onClick={handleShare}
                    className="absolute right-2 top-2 bottom-2 bg-ink text-white px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                  >
                    Invite
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Shared with</p>
                  <div className="space-y-2">
                    {selectedDoc?.sharedWith?.map(email => (
                      <div key={email} className="flex items-center justify-between p-3 bg-sand rounded-xl">
                        <span className="text-xs text-ink">{email}</span>
                        <button className="text-rose-500 hover:text-rose-600">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {(!selectedDoc?.sharedWith || selectedDoc.sharedWith.length === 0) && (
                      <p className="text-xs text-stone-400 italic">No one shared yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplates(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-3xl font-serif italic text-ink">New Document</h3>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Choose a template or start blank</p>
                </div>
                <button onClick={() => setShowTemplates(false)} className="text-stone-400 hover:text-ink">
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => handleCreate()}
                  className="p-6 bg-sand border-2 border-dashed border-stone-200 rounded-[2rem] text-left hover:border-turquoise hover:bg-white transition-all group"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-300 group-hover:text-turquoise mb-4 shadow-sm">
                    <Plus size={24} />
                  </div>
                  <h4 className="font-serif italic text-xl text-ink">Blank Document</h4>
                  <p className="text-xs text-stone-500 mt-1">Start from scratch with AI assistance.</p>
                </button>
                
                {TEMPLATES.map(template => (
                  <button 
                    key={template.title}
                    onClick={() => handleCreate(template.type, template.content, template.title)}
                    className="p-6 bg-white border border-stone-100 rounded-[2rem] text-left hover:border-turquoise hover:shadow-xl transition-all group"
                  >
                    <div className="w-12 h-12 bg-sand rounded-2xl flex items-center justify-center text-ink mb-4">
                      <FileText size={24} />
                    </div>
                    <h4 className="font-serif italic text-xl text-ink">{template.title}</h4>
                    <p className="text-xs text-stone-500 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
