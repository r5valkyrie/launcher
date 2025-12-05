import React from 'react';
import ListItemWrapper from '../ui/ListItemWrapper';

type NewsPanelProps = {
  // View and filter state
  patchNotesView: 'grid' | 'timeline';
  setPatchNotesView: (view: 'grid' | 'timeline') => void;
  patchNotesFilter: 'all' | 'community' | 'patch-notes' | 'dev-blog';
  setPatchNotesFilter: (filter: 'all' | 'community' | 'patch-notes' | 'dev-blog') => void;
  patchNotesSearch: string;
  setPatchNotesSearch: (search: string) => void;

  // Data
  filteredPatchPosts: any[];
  patchLoading: boolean;

  // Post interactions
  readPosts: Set<string>;
  favoritePosts: Set<string>;
  markPostAsRead: (url: string) => void;
  toggleFavoritePost: (url: string) => void;
  getPostCategory: (post: any) => 'patch-notes' | 'community' | 'dev-blog';
  openNewsPost: (post: any) => void;
  
  // Available categories
  availableCategories: Set<string>;
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Posts' },
  { value: 'community', label: 'Community' },
  { value: 'patch-notes', label: 'Patch Notes' },
  { value: 'dev-blog', label: 'Dev Blog' },
] as const;

export default function NewsPanel(props: NewsPanelProps) {
  const {
    patchNotesView,
    setPatchNotesView,
    patchNotesFilter,
    setPatchNotesFilter,
    patchNotesSearch,
    setPatchNotesSearch,
    filteredPatchPosts,
    patchLoading,
    readPosts,
    favoritePosts,
    markPostAsRead,
    toggleFavoritePost,
    getPostCategory,
    openNewsPost,
    availableCategories,
  } = props;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'patch-notes': return { 
        bg: 'bg-blue-500/20', 
        text: 'text-blue-400', 
        border: 'border-blue-500/30', 
        dot: 'bg-blue-500',
        glow: 'shadow-blue-500/40',
        hoverGlow: 'hover:shadow-blue-500/60',
        activeGlow: 'shadow-blue-500/50',
        gradient: 'from-blue-500/30 to-blue-600/20'
      };
      case 'community': return { 
        bg: 'bg-purple-500/20', 
        text: 'text-purple-400', 
        border: 'border-purple-500/30', 
        dot: 'bg-purple-500',
        glow: 'shadow-purple-500/40',
        hoverGlow: 'hover:shadow-purple-500/60',
        activeGlow: 'shadow-purple-500/50',
        gradient: 'from-purple-500/30 to-purple-600/20'
      };
      case 'dev-blog': return { 
        bg: 'bg-amber-500/20', 
        text: 'text-amber-400', 
        border: 'border-amber-500/30', 
        dot: 'bg-amber-500',
        glow: 'shadow-amber-500/40',
        hoverGlow: 'hover:shadow-amber-500/60',
        activeGlow: 'shadow-amber-500/50',
        gradient: 'from-amber-500/30 to-amber-600/20'
      };
      default: return { 
        bg: 'bg-base-300/50', 
        text: 'text-base-content/70', 
        border: 'border-white/10', 
        dot: 'bg-base-content/50',
        glow: 'shadow-white/20',
        hoverGlow: 'hover:shadow-white/30',
        activeGlow: 'shadow-white/25',
        gradient: 'from-base-300/40 to-base-300/30'
      };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'patch-notes': return 'Patch Notes';
      case 'community': return 'Community';
      case 'dev-blog': return 'Dev Blog';
      default: return category;
    }
  };

  // Filter options to only show categories that have content
  const visibleFilterOptions = React.useMemo(() => {
    return FILTER_OPTIONS.filter(option => 
      availableCategories.has(option.value)
    );
  }, [availableCategories]);

  // Sort posts to put patch-notes first when viewing all posts
  const sortedPosts = patchNotesFilter === 'all' 
    ? [...filteredPatchPosts].sort((a, b) => {
        const catA = getPostCategory(a);
        const catB = getPostCategory(b);
        // Patch notes come first
        if (catA === 'patch-notes' && catB !== 'patch-notes') return -1;
        if (catA !== 'patch-notes' && catB === 'patch-notes') return 1;
        // Otherwise maintain original order (by date)
        return 0;
      })
    : filteredPatchPosts;

  return (
    <div className="xl:col-span-2">
      {/* Combined Panel - Enhanced */}
      <div className="glass rounded-xl p-6 min-h-[600px]">
        {/* Header - Enhanced */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          {/* Info Section */}
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
              <svg className="relative w-6 h-6 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text text-transparent">News & Updates</h3>
            </div>
          </div>
          
          {/* View Controls - Enhanced */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1.5 bg-base-300/40 border border-white/5 rounded-xl">
              <button 
                className={`p-2 rounded-lg transition-all duration-300 ${
                  patchNotesView === 'grid' 
                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/30 scale-105' 
                    : 'text-base-content/50 hover:text-base-content hover:bg-base-300/50'
                }`}
                onClick={() => setPatchNotesView('grid')}
                title="Grid View"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button 
                className={`p-2 rounded-lg transition-all duration-300 ${
                  patchNotesView === 'timeline' 
                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/30 scale-105' 
                    : 'text-base-content/50 hover:text-base-content hover:bg-base-300/50'
                }`}
                onClick={() => setPatchNotesView('timeline')}
                title="Timeline View"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="4" cy="6" r="1" fill="currentColor"/>
                  <circle cx="4" cy="12" r="1" fill="currentColor"/>
                  <circle cx="4" cy="18" r="1" fill="currentColor"/>
                </svg>
              </button>
            </div>
            
            <a 
              className="btn btn-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 gap-2 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300" 
              href="https://blog.playvalkyrie.org/" 
              target="_blank" 
              rel="noreferrer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Visit Blog
            </a>
          </div>
        </div>

        {/* Filter and Search Section - Enhanced */}
        <div className="space-y-4 mb-6">
          {/* Filter Pills - Cleaner Design */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visibleFilterOptions.map(filter => {
              const colors = filter.value !== 'all' ? getCategoryColor(filter.value) : null;
              const isActive = patchNotesFilter === filter.value;
              
              return (
                <button
                  key={filter.value}
                  className={`relative px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? colors 
                        ? `${colors.bg} ${colors.text} border-2 ${colors.border} shadow-sm ${colors.activeGlow}`
                        : 'bg-primary/20 text-primary border-2 border-primary/50 shadow-sm shadow-primary/30'
                      : 'bg-base-300/30 text-base-content/60 hover:bg-base-300/50 hover:text-base-content border-2 border-transparent hover:border-white/10'
                  }`}
                  onClick={() => setPatchNotesFilter(filter.value)}
                >
                  <span className="flex items-center gap-2">
                    {/* Category dot indicator */}
                    {colors && isActive && (
                      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    )}
                    {filter.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Section - Enhanced */}
          <div className="relative">
            <svg className="z-10 absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search news and updates..." 
              className="input w-full pl-12 pr-12 bg-gradient-to-r from-base-300/40 to-base-300/30 border border-white/5 hover:border-white/10 focus:border-primary/30 focus:from-base-300/50 focus:to-base-300/40 transition-all duration-300 rounded-xl"
              value={patchNotesSearch}
              onChange={(e) => setPatchNotesSearch(e.target.value)}
            />
            {patchNotesSearch && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-red-500/20 text-base-content/50 hover:text-red-400 transition-all duration-300 hover:scale-110"
                onClick={() => setPatchNotesSearch('')}
                title="Clear search"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Posts Content */}
        <div>
          {/* Loading State */}
          {patchLoading && filteredPatchPosts.length === 0 && (
            <div className={patchNotesView === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`ps-${i}`} className="rounded-xl overflow-hidden bg-gradient-to-br from-base-300/30 via-base-300/20 to-base-300/30 border border-white/5 relative">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ animationDelay: `${i * 0.1}s` }} />
                  
                  {patchNotesView === 'grid' && (
                    <div className="w-full pb-[45%] bg-gradient-to-br from-base-300/50 via-base-300/40 to-base-300/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      {/* Badge placeholder */}
                      <div className="absolute top-3 left-3 w-20 h-5 bg-white/5 rounded backdrop-blur-sm" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gradient-to-r from-base-300/50 via-base-300/40 to-base-300/50 rounded-lg w-3/4" />
                    <div className="h-3 bg-gradient-to-r from-base-300/40 via-base-300/30 to-base-300/40 rounded-lg w-full" />
                    <div className="h-3 bg-gradient-to-r from-base-300/40 via-base-300/30 to-base-300/40 rounded-lg w-2/3" />
                    {patchNotesView === 'grid' && (
                      <div className="h-8 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 rounded-lg w-24 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!patchLoading || filteredPatchPosts.length > 0) && (
            <>
              {/* Grid View */}
              {patchNotesView === 'grid' ? (
                <div 
                  key={`grid-${patchNotesFilter}`} 
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeSlideIn"
                >
                  {sortedPosts.map((post, index) => {
                    const category = getPostCategory(post);
                    const colors = getCategoryColor(category);
                    const isRead = readPosts.has(post.url);
                    const isFavorite = favoritePosts.has(post.url);
                    
                    return (
                      <ListItemWrapper key={post.url} itemKey={post.url} type="news" delay={index * 50}>
                        <div className={`group rounded-2xl overflow-hidden bg-gradient-to-br from-base-300/30 to-base-300/20 border transition-all duration-500 hover:-translate-y-2 ${
                          isRead 
                            ? 'border-white/5 opacity-60 hover:opacity-80' 
                            : 'border-white/10 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10'
                        }`}>
                          {/* Image */}
                          <div className="relative w-full pb-[45%] bg-gradient-to-br from-base-300/50 to-base-300/30 overflow-hidden">
                            {post.feature_image ? (
                              <img 
                                loading="lazy" 
                                src={post.feature_image} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-base-300/60 to-base-300/40">
                                <svg className="w-14 h-14 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            
                            {/* Category Badge */}
                            <div className="absolute top-3 left-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
                                {getCategoryLabel(category)}
                              </span>
                            </div>

                            {/* Unread Indicator */}
                            {!isRead && (
                              <div className="absolute top-3 right-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse"></div>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="p-4 bg-gradient-to-b from-base-300/20 to-transparent">
                            <h4 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">{post.title}</h4>
                            
                            <div className="flex items-center gap-2 text-xs text-base-content/50 mb-3">
                              {post.published_at && (
                                <>
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                  </svg>
                                  <span className="font-medium">{new Date(post.published_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}</span>
                                </>
                              )}
                            </div>
                            
                            {post.excerpt && (
                              <p className="text-xs text-base-content/60 line-clamp-2 mb-4 leading-relaxed">{post.excerpt}</p>
                            )}
                            
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <button 
                                className="btn btn-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-content border-0 gap-1.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
                                onClick={() => openNewsPost(post)}
                              >
                                Read More
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                              </button>
                              {isFavorite && (
                                <span className="text-xs text-amber-400 flex items-center gap-1.5 font-medium">
                                  <svg className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 24 24">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                  </svg>
                                  Saved
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </ListItemWrapper>
                    );
                  })}
                </div>
              ) : (
                /* Timeline View */
                <div 
                  key={`timeline-${patchNotesFilter}`} 
                  className="space-y-3 animate-fadeSlideIn"
                >
                  {sortedPosts.map((post, index) => {
                    const category = getPostCategory(post);
                    const colors = getCategoryColor(category);
                    const isRead = readPosts.has(post.url);
                    const isFavorite = favoritePosts.has(post.url);
                    
                    return (
                      <ListItemWrapper key={post.url} itemKey={post.url} type="news" delay={index * 50}>
                        <div className={`group flex gap-4 p-5 rounded-2xl bg-gradient-to-r from-base-300/30 to-base-300/20 border transition-all duration-500 ${
                          isRead 
                            ? 'border-white/5 opacity-60 hover:opacity-80 hover:shadow-lg hover:shadow-black/10' 
                            : 'border-white/10 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10'
                        }`}>
                          {/* Timeline Indicator - Enhanced */}
                          <div className="flex flex-col items-center pt-1">
                            <div className={`w-4 h-4 rounded-full ${colors.dot} ring-4 ring-base-100 shadow-lg ${colors.dot === 'bg-blue-500' ? 'shadow-blue-500/30' : colors.dot === 'bg-purple-500' ? 'shadow-purple-500/30' : 'shadow-amber-500/30'} transition-all duration-500 group-hover:scale-125`}></div>
                            {index < sortedPosts.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-white/20 via-white/10 to-transparent mt-3"></div>}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors duration-300">{post.title}</h4>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                                  {getCategoryLabel(category)}
                                </span>
                                {!isRead && (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">New</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {post.published_at && (
                              <div className="flex items-center gap-2 text-xs text-base-content/50 mb-3">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <span className="font-medium">{new Date(post.published_at).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}</span>
                              </div>
                            )}
                            
                            {post.excerpt && (
                              <p className="text-xs text-base-content/60 mb-3 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                            )}
                            
                            <button 
                              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-all duration-300 group/btn hover:gap-3"
                              onClick={() => openNewsPost(post)}
                            >
                              Read Full Article
                              <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </ListItemWrapper>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {filteredPatchPosts.length === 0 && !patchLoading && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-base-300/30 flex items-center justify-center">
                    <svg className="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">No posts found</h4>
                  {(patchNotesSearch.trim() || patchNotesFilter !== 'all') && (
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => { setPatchNotesSearch(''); setPatchNotesFilter('all'); }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
