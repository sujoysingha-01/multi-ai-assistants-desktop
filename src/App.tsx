import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, MessageSquare, Settings, Maximize2, X, Minus, Copy, Clipboard, Languages, Loader2 } from 'lucide-react'
import { ipcRenderer } from 'electron'

const DEFAULT_PROVIDERS = [
  { 
    id: 'gemini', 
    name: 'Google Gemini', 
    url: 'https://gemini.google.com',
    icon: <img src="https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64" alt="Gemini" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'chatgpt', 
    name: 'OpenAI ChatGPT', 
    url: 'https://chatgpt.com',
    icon: <img src="https://www.google.com/s2/favicons?domain=chatgpt.com&sz=64" alt="ChatGPT" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'claude', 
    name: 'Claude AI', 
    url: 'https://claude.ai',
    icon: <img src="https://www.google.com/s2/favicons?domain=claude.ai&sz=64" alt="Claude" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'copilot', 
    name: 'Microsoft Copilot', 
    url: 'https://copilot.microsoft.com',
    icon: <img src="https://www.google.com/s2/favicons?domain=copilot.microsoft.com&sz=64" alt="Copilot" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'perplexity', 
    name: 'Perplexity AI', 
    url: 'https://www.perplexity.ai',
    icon: <img src="https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64" alt="Perplexity" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'grok', 
    name: 'xAI Grok', 
    url: 'https://grok.com',
    icon: <img src="https://www.google.com/s2/favicons?domain=grok.com&sz=64" alt="Grok" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'meta', 
    name: 'Meta AI', 
    url: 'https://www.meta.ai',
    icon: <img src="https://www.google.com/s2/favicons?domain=meta.ai&sz=64" alt="Meta AI" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    url: 'https://chat.deepseek.com',
    icon: <img src="https://www.google.com/s2/favicons?domain=deepseek.com&sz=64" alt="DeepSeek" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'mistral', 
    name: 'Mistral Le Chat', 
    url: 'https://chat.mistral.ai',
    icon: <img src="https://www.google.com/s2/favicons?domain=mistral.ai&sz=64" alt="Mistral" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'poe', 
    name: 'Poe AI', 
    url: 'https://poe.com',
    icon: <img src="https://www.google.com/s2/favicons?domain=poe.com&sz=64" alt="Poe" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'pi', 
    name: 'Pi by Inflection', 
    url: 'https://pi.ai',
    icon: <img src="https://www.google.com/s2/favicons?domain=pi.ai&sz=64" alt="Pi" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'qwen', 
    name: 'Alibaba Qwen', 
    url: 'https://chat.qwenlm.ai/',
    icon: <img src="https://www.google.com/s2/favicons?domain=chat.qwenlm.ai&sz=64" alt="Qwen" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'huggingchat', 
    name: 'HuggingChat', 
    url: 'https://huggingface.co/chat/',
    icon: <img src="https://www.google.com/s2/favicons?domain=huggingface.co&sz=64" alt="HuggingChat" className="w-6 h-6 rounded-md" />
  },
  { 
    id: 'wan', 
    name: 'Wan AI', 
    url: 'https://wan.video',
    icon: <img src="https://www.google.com/s2/favicons?domain=wan.video&sz=64" alt="Wan" className="w-6 h-6 rounded-md" />
  }
]

function App() {
  // Load custom providers from local storage if available
  const [providers, setProviders] = useState(() => {
    const saved = localStorage.getItem('custom-providers');
    return saved ? [...DEFAULT_PROVIDERS, ...JSON.parse(saved)] : DEFAULT_PROVIDERS;
  });

  const [disabledProviders, setDisabledProviders] = useState<string[]>(() => {
    const saved = localStorage.getItem('disabled-providers');
    return saved ? JSON.parse(saved) : [];
  });

  const enabledProviders = providers.filter(p => !disabledProviders.includes(p.id));

  const [activeProvider, setActiveProvider] = useState(enabledProviders[0] || providers[0])
  const [isDarkMode, setIsDarkMode] = useState(true) // Start dark for premium feel
  const [showSettings, setShowSettings] = useState(false)
  const [borderAnimated, setBorderAnimated] = useState(true)

  const [memorySaver, setMemorySaver] = useState(() => {
    const saved = localStorage.getItem('memory-saver');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [autoStart, setAutoStart] = useState(false);

  // Initialize autostart state
  useEffect(() => {
    const fetchAutoStart = async () => {
      try {
        const val = await ipcRenderer.invoke('get-autostart');
        setAutoStart(val);
      } catch (e) {}
    };
    fetchAutoStart();
  }, []);

  const [targetLanguage, setTargetLanguage] = useState(() => {
    return localStorage.getItem('target-language') || 'bn';
  });

  const [globalShortcut, setGlobalShortcut] = useState(() => {
    return localStorage.getItem('global-shortcut') || 'CommandOrControl+Shift+Space';
  });

  // Notify main process of shortcut changes
  useEffect(() => {
    try {
      ipcRenderer.send('update-shortcut', globalShortcut);
    } catch (e) {}
  }, [globalShortcut]);

  const [newAiName, setNewAiName] = useState('')
  const [newAiUrl, setNewAiUrl] = useState('')

  // Context Menu and Translation
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, text: string, canCopy: boolean, canPaste: boolean, webview: any} | null>(null);
  const [translation, setTranslation] = useState<{text: string, translated: string, loading: boolean} | null>(null);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleWebviewRef = (webview: any) => {
    if (!webview) return;
    if (webview.hasAttribute('data-context-attached')) return;
    webview.setAttribute('data-context-attached', 'true');
    
    webview.addEventListener('context-menu', (e: any) => {
      e.preventDefault();
      
      const x = e.params.x + 64; 
      const y = e.params.y + 32;

      setContextMenu({
        x,
        y,
        text: e.params.selectionText || '',
        canCopy: e.params.editFlags.canCopy,
        canPaste: e.params.editFlags.canPaste,
        webview: webview
      });
    });
  }

  const handleTranslate = async (text: string) => {
    setContextMenu(null);
    setTranslation({ text, translated: '', loading: true });
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      
      if (data && data[0]) {
        const translatedText = data[0].map((item: any) => item[0]).join('');
        setTranslation({ text, translated: translatedText, loading: false });
      } else {
        setTranslation({ text, translated: 'Translation failed.', loading: false });
      }
    } catch (err) {
      setTranslation({ text, translated: 'Error connecting to Google Translate.', loading: false });
    }
  }

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu?.webview) return;
    if (action === 'copy') contextMenu.webview.copy();
    if (action === 'paste') contextMenu.webview.paste();
    if (action === 'cut') contextMenu.webview.cut();
    setContextMenu(null);
  }

  const handleAddCustomProvider = () => {
    if (!newAiName || !newAiUrl) return;
    const newProvider = {
      id: 'custom-' + Date.now(),
      name: newAiName,
      url: newAiUrl,
      icon: <MessageSquare size={20} />
    };
    const updated = [...providers, newProvider];
    setProviders(updated);
    
    // Save only custom ones
    const customOnly = updated.filter(p => p.id.startsWith('custom-'));
    localStorage.setItem('custom-providers', JSON.stringify(customOnly.map(p => ({id: p.id, name: p.name, url: p.url}))));
    
    setNewAiName('');
    setNewAiUrl('');
  }

  const handleDeleteProvider = (id: string) => {
    const updated = providers.filter(p => p.id !== id);
    setProviders(updated);
    if (activeProvider.id === id) {
      const nextActive = updated.filter(p => !disabledProviders.includes(p.id))[0] || updated[0];
      setActiveProvider(nextActive);
    }
    
    const customOnly = updated.filter(p => p.id.startsWith('custom-'));
    localStorage.setItem('custom-providers', JSON.stringify(customOnly.map(p => ({id: p.id, name: p.name, url: p.url}))));
  }

  const toggleProvider = (id: string) => {
    const isCurrentlyDisabled = disabledProviders.includes(id);
    let newDisabled;
    if (isCurrentlyDisabled) {
      newDisabled = disabledProviders.filter(pid => pid !== id);
    } else {
      newDisabled = [...disabledProviders, id];
    }
    setDisabledProviders(newDisabled);
    localStorage.setItem('disabled-providers', JSON.stringify(newDisabled));
    
    // Switch active if we disabled the current one
    if (!isCurrentlyDisabled && activeProvider.id === id) {
      const firstEnabled = providers.find(p => !newDisabled.includes(p.id)) || providers[0];
      setActiveProvider(firstEnabled);
    }
  }

  // Using CSS variable for theme background in inner content
  const bgColor = isDarkMode ? '#1e1e24' : '#ffffff'
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900'
  const sidebarBg = isDarkMode ? 'bg-[#18181b]' : 'bg-gray-100'
  const borderClass = borderAnimated ? 'animated-border' : 'border-2 border-blue-500'

  const handleWindowControl = (action: string) => {
    try {
      ipcRenderer.send(action);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  }

  return (
    <div 
      className={`h-screen w-screen bg-[#18181b] overflow-hidden`}
      style={{ '--bg-color': bgColor } as React.CSSProperties}
    >
      <div className={`${borderClass} h-full w-full`}>
        <div className={`animated-border-inner flex flex-col ${textColor}`}>
          
          {/* Custom Titlebar (draggable) */}
          <div className="h-8 w-full flex justify-between items-center px-4 drag-region">
            <div className="font-semibold text-sm opacity-80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Multi-AI Assistant
            </div>
            {/* Window Controls */}
            <div className="flex space-x-3 items-center opacity-70 z-50">
               <div className="no-drag-region p-1 hover:bg-white/10 rounded cursor-pointer transition-colors" onClick={() => handleWindowControl('window-minimize')}>
                 <Minus size={14} className="hover:text-blue-400" />
               </div>
               <div className="no-drag-region p-1 hover:bg-white/10 rounded cursor-pointer transition-colors" onClick={() => handleWindowControl('window-maximize')}>
                 <Maximize2 size={12} className="hover:text-blue-400" />
               </div>
               <div className="no-drag-region p-1 hover:bg-red-500/20 rounded cursor-pointer transition-colors" onClick={() => handleWindowControl('window-close')}>
                 <X size={14} className="hover:text-red-500" />
               </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className={`w-16 flex flex-col items-center py-4 space-y-6 ${sidebarBg} transition-colors duration-300 z-10`}>
              {/* Logo icon */}
              <div className="p-2 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl mb-4">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              
              {/* Providers list icons/indicators */}
              <div className="flex-1 flex flex-col space-y-4 w-full px-2 overflow-y-auto no-scrollbar pb-4">
                {enabledProviders.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActiveProvider(p)}
                    title={p.name}
                    className={`relative p-3 rounded-xl flex justify-center items-center transition-all flex-shrink-0 ${
                      activeProvider.id === p.id 
                        ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                        : 'hover:bg-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {p.icon}
                    {activeProvider.id === p.id && (
                       <span className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-md"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Bottom Settings */}
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-xl transition-all ${
                  showSettings 
                    ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'hover:bg-white/10 opacity-60 hover:opacity-100'
                }`}
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>

            {/* Main Content Area (Webviews) */}
            <div className="flex-1 relative bg-white dark:bg-[#1e1e24]">
              
              {/* Settings Overlay */}
              {showSettings && (
                <div className={`absolute inset-0 z-50 p-8 overflow-y-auto ${isDarkMode ? 'bg-[#1e1e24]' : 'bg-white'}`}>
                  <h2 className="text-2xl font-bold mb-6">Settings</h2>
                  
                  <div className="space-y-6 max-w-md">
                    <div className="flex items-center justify-between">
                      <span>Dark Mode</span>
                      <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Animated Border</div>
                        <div className="text-xs opacity-60">Premium glowing border effect</div>
                      </div>
                      <button 
                        onClick={() => setBorderAnimated(!borderAnimated)}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${borderAnimated ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${borderAnimated ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Run at Startup</div>
                        <div className="text-xs opacity-60">Start app automatically with Windows</div>
                      </div>
                      <button 
                        onClick={() => {
                          const val = !autoStart;
                          setAutoStart(val);
                          try {
                            ipcRenderer.send('set-autostart', val);
                          } catch (e) {}
                        }}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${autoStart ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${autoStart ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>

                    <div className="pt-6 border-t border-gray-700">
                      <div className="font-semibold mb-2">Global Shortcut</div>
                      <select 
                        className="w-full p-2 bg-black/20 rounded border border-gray-700 focus:border-blue-500 outline-none appearance-none"
                        value={globalShortcut}
                        onChange={(e) => {
                          setGlobalShortcut(e.target.value);
                          localStorage.setItem('global-shortcut', e.target.value);
                        }}
                      >
                        <option value="CommandOrControl+Shift+Space">Ctrl + Shift + Space</option>
                        <option value="Alt+Space">Alt + Space</option>
                        <option value="CommandOrControl+Alt+Space">Ctrl + Alt + Space</option>
                        <option value="CommandOrControl+Shift+A">Ctrl + Shift + A</option>
                      </select>
                      <div className="text-xs opacity-60 text-center mt-2">
                        Use this shortcut from anywhere to summon the assistant.
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-700">
                      <div className="font-semibold mb-2">Translation Target Language</div>
                      <select 
                        className="w-full p-2 bg-black/20 rounded border border-gray-700 focus:border-blue-500 outline-none appearance-none"
                        value={targetLanguage}
                        onChange={(e) => {
                          setTargetLanguage(e.target.value);
                          localStorage.setItem('target-language', e.target.value);
                        }}
                      >
                        <option value="bn">Bengali</option>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="ar">Arabic</option>
                      </select>
                    </div>

                    {/* Manage AI Providers (Toggle ON/OFF) */}
                    <div className="pt-6 border-t border-gray-700">
                      <div className="font-semibold mb-4">Manage AI Providers</div>
                      <div className="text-xs opacity-60 mb-3">Enable or disable AIs from the sidebar.</div>
                      <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-2">
                        {providers.map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-black/10 p-2 rounded">
                            <span className="text-sm flex items-center gap-3">
                              <div className="w-5 h-5 flex items-center justify-center shrink-0 [&>img]:w-5 [&>img]:h-5 [&>svg]:w-5 [&>svg]:h-5">
                                {p.icon}
                              </div> 
                              {p.name}
                            </span>
                            <div className="flex items-center gap-3">
                              {p.id.startsWith('custom-') && (
                                <button onClick={() => handleDeleteProvider(p.id)} className="text-red-500 hover:text-red-400 p-1">
                                  <X size={14} />
                                </button>
                              )}
                              <button 
                                onClick={() => toggleProvider(p.id)}
                                className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${!disabledProviders.includes(p.id) ? 'bg-blue-500' : 'bg-gray-500'}`}
                              >
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${!disabledProviders.includes(p.id) ? 'translate-x-5' : ''}`} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-700">
                      <div className="font-semibold mb-4">Add Custom AI Provider</div>
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="Name (e.g. Perplexity AI)" 
                          className="w-full p-2 bg-black/20 rounded border border-gray-700 focus:border-blue-500 outline-none"
                          value={newAiName}
                          onChange={e => setNewAiName(e.target.value)}
                        />
                        <input 
                          type="url" 
                          placeholder="URL (e.g. https://perplexity.ai)" 
                          className="w-full p-2 bg-black/20 rounded border border-gray-700 focus:border-blue-500 outline-none"
                          value={newAiUrl}
                          onChange={e => setNewAiUrl(e.target.value)}
                        />
                        <button 
                          onClick={handleAddCustomProvider}
                          className="w-full p-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
                        >
                          Add Provider
                        </button>
                      </div>
                      <div className="pt-6 border-t border-gray-700">
                        <div className="font-semibold mb-2">Memory Saver</div>
                        <div className="text-xs opacity-60 mb-3">
                          Unload inactive AIs to save RAM. (Turn off for fast switching).
                        </div>
                        <button 
                          onClick={() => {
                            const val = !memorySaver;
                            setMemorySaver(val);
                            localStorage.setItem('memory-saver', JSON.stringify(val));
                          }}
                          className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${memorySaver ? 'bg-blue-500' : 'bg-gray-500'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${memorySaver ? 'translate-x-6' : ''}`} />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Webviews */}
              {enabledProviders.map(p => {
                // If Memory Saver is ON and this isn't the active provider, don't render it at all
                if (memorySaver && activeProvider.id !== p.id) {
                  return null;
                }

                return (
                  <div 
                    key={p.id} 
                    className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${
                      activeProvider.id === p.id && !showSettings ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    {/* @ts-ignore */}
                    <webview
                      ref={handleWebviewRef}
                      src={p.url}
                      className="w-full h-full"
                      style={{ border: 'none' }}
                      partition={`persist:${p.id}`}
                      allowpopups="true"
                    />
                  </div>
                )
              })}

              {/* Custom Context Menu */}
              {contextMenu && (
                <div 
                  className={`absolute z-[100] w-48 rounded-lg shadow-xl overflow-hidden border border-gray-700/50 ${isDarkMode ? 'bg-[#27272a] text-white' : 'bg-white text-gray-900'}`}
                  style={{ top: Math.min(contextMenu.y, window.innerHeight - 150), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex flex-col py-1 text-sm">
                    {contextMenu.text && (
                      <>
                        <button onClick={() => handleTranslate(contextMenu.text)} className="flex items-center px-4 py-2 hover:bg-blue-500 hover:text-white transition-colors text-left w-full">
                          <Languages size={16} className="mr-3" />
                          Translate Text
                        </button>
                        <div className="h-px bg-gray-700/30 my-1"></div>
                      </>
                    )}
                    <button 
                      onClick={() => handleContextMenuAction('copy')} 
                      disabled={!contextMenu.canCopy}
                      className="flex items-center px-4 py-2 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-left w-full transition-colors"
                    >
                      <Copy size={16} className="mr-3" />
                      Copy
                    </button>
                    <button 
                      onClick={() => handleContextMenuAction('paste')} 
                      disabled={!contextMenu.canPaste}
                      className="flex items-center px-4 py-2 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-left w-full transition-colors"
                    >
                      <Clipboard size={16} className="mr-3" />
                      Paste
                    </button>
                  </div>
                </div>
              )}

              {/* Translation Popup Modal */}
              {translation && (
                <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setTranslation(null)}>
                  <div 
                    className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-gray-700/50 ${isDarkMode ? 'bg-[#1e1e24] text-white' : 'bg-white text-gray-900'}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Languages className="text-blue-500" /> Translation
                      </h3>
                      <button onClick={() => setTranslation(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-black/10 rounded-xl text-sm opacity-80 border border-gray-700/30 max-h-32 overflow-y-auto no-scrollbar">
                        {translation.text}
                      </div>

                      <div className="flex justify-center py-2">
                        {translation.loading ? (
                          <Loader2 size={24} className="animate-spin text-blue-500" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-500">↓</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-blue-500/10 rounded-xl text-base border border-blue-500/20 max-h-48 overflow-y-auto no-scrollbar">
                        {translation.translated}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App
