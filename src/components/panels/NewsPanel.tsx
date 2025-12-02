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
  } = props;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'patch-notes': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-500' };
      case 'community': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', dot: 'bg-purple-500' };
      case 'dev-blog': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' };
      default: return { bg: 'bg-base-300/50', text: 'text-base-content/70', border: 'border-white/10', dot: 'bg-base-content/50' };
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

  return (
    <div className="xl:col-span-2">
      {/* Combined Panel */}
      <div className="glass rounded-xl p-4 min-h-[600px]">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          {/* Info Section */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">News & Updates</h3>
              {!!(filteredPatchPosts && filteredPatchPosts.length) && (
                <p className="text-xs text-base-content/50">{filteredPatchPosts.length} post{filteredPatchPosts.length !== 1 ? 's' : ''} available</p>
              )}
            </div>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-base-300/30 rounded-lg">
              <button 
                className={`p-2 rounded-md transition-all ${patchNotesView === 'grid' ? 'bg-primary text-primary-content shadow' : 'text-base-content/50 hover:text-base-content hover:bg-base-300/50'}`}
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
                className={`p-2 rounded-md transition-all ${patchNotesView === 'timeline' ? 'bg-primary text-primary-content shadow' : 'text-base-content/50 hover:text-base-content hover:bg-base-300/50'}`}
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
              className="btn btn-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 gap-2 shadow-lg shadow-blue-500/20" 
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

        {/* Filter and Search Section */}
        <div className="space-y-4 mb-6">
          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTER_OPTIONS.map(filter => (
              <button
                key={filter.value}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  patchNotesFilter === filter.value
                    ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                    : 'bg-base-300/30 text-base-content/60 hover:bg-base-300/50 hover:text-base-content'
                }`}
                onClick={() => setPatchNotesFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search Section */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search news and updates..." 
              className="input w-full pl-12 pr-4 bg-base-300/30 border-0 focus:bg-base-300/50 transition-colors"
              value={patchNotesSearch}
              onChange={(e) => setPatchNotesSearch(e.target.value)}
            />
            {patchNotesSearch && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-base-300/50 text-base-content/50 hover:text-base-content"
                onClick={() => setPatchNotesSearch('')}
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
          {patchLoading && (
            <div className={patchNotesView === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`ps-${i}`} className="rounded-xl overflow-hidden bg-base-300/20 border border-white/5 animate-pulse">
                  {patchNotesView === 'grid' && <div className="w-full pb-[40%] bg-base-300/30" />}
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-base-300/40 rounded w-3/4" />
                    <div className="h-3 bg-base-300/30 rounded w-full" />
                    <div className="h-3 bg-base-300/30 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!patchLoading && (
            <>
              {/* Grid View */}
              {patchNotesView === 'grid' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredPatchPosts.map((post, index) => {
                    const category = getPostCategory(post);
                    const colors = getCategoryColor(category);
                    const isRead = readPosts.has(post.url);
                    const isFavorite = favoritePosts.has(post.url);
                    
                    return (
                      <ListItemWrapper key={post.url} itemKey={post.url} type="news" delay={index * 50}>
                        <div className={`group rounded-xl overflow-hidden bg-base-300/20 border transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 ${isRead ? 'border-white/5 opacity-70' : 'border-white/10 hover:border-white/20'}`}>
                          {/* Image */}
                          <div className="relative w-full pb-[45%] bg-base-300/30 overflow-hidden">
                            {post.feature_image ? (
                              <img 
                                loading="lazy" 
                                src={post.feature_image} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-12 h-12 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            
                            {/* Category Badge */}
                            <div className="absolute top-3 left-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                                {getCategoryLabel(category)}
                              </span>
                            </div>

                            {/* Favorite Button */}
                            <button 
                              className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${
                                isFavorite 
                                  ? 'bg-amber-500/90 text-white' 
                                  : 'bg-black/40 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-black/60'
                              }`}
                              onClick={(e) => { e.preventDefault(); toggleFavoritePost(post.url); }}
                              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            </button>

                            {/* Unread Badge */}
                            {!isRead && (
                              <div className="absolute bottom-3 left-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/90 text-white">
                                  New
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="p-4">
                            <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h4>
                            
                            <div className="flex items-center gap-2 text-xs text-base-content/50 mb-2">
                              {post.published_at && (
                                <>
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                  </svg>
                                  <span>{new Date(post.published_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}</span>
                                </>
                              )}
                            </div>
                            
                            {post.excerpt && (
                              <p className="text-xs text-base-content/60 line-clamp-2 mb-4">{post.excerpt}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <a 
                                href={post.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-sm btn-primary gap-1"
                                onClick={() => markPostAsRead(post.url)}
                              >
                                Read More
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                              </a>
                              {isFavorite && (
                                <span className="text-xs text-amber-500/70 flex items-center gap-1">
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
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
                <div className="space-y-3">
                  {filteredPatchPosts.map((post, index) => {
                    const category = getPostCategory(post);
                    const colors = getCategoryColor(category);
                    const isRead = readPosts.has(post.url);
                    const isFavorite = favoritePosts.has(post.url);
                    
                    return (
                      <ListItemWrapper key={post.url} itemKey={post.url} type="news" delay={index * 50}>
                        <div className={`group flex gap-4 p-4 rounded-xl bg-base-300/20 border transition-all hover:shadow-lg hover:shadow-black/10 ${isRead ? 'border-white/5 opacity-70' : 'border-white/10 hover:border-white/20'}`}>
                          {/* Timeline Indicator */}
                          <div className="flex flex-col items-center pt-1">
                            <div className={`w-3 h-3 rounded-full ${colors.dot} ring-4 ring-base-100`}></div>
                            {index < filteredPatchPosts.length - 1 && <div className="w-px flex-1 bg-white/10 mt-2"></div>}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{post.title}</h4>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                                  {getCategoryLabel(category)}
                                </span>
                                {!isRead && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400">
                                    New
                                  </span>
                                )}
                              </div>
                              <button 
                                className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                                  isFavorite 
                                    ? 'bg-amber-500/20 text-amber-400' 
                                    : 'text-base-content/30 hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                                onClick={() => toggleFavoritePost(post.url)}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              </button>
                            </div>
                            
                            {post.published_at && (
                              <div className="flex items-center gap-1.5 text-xs text-base-content/40 mb-2">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                {new Date(post.published_at).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            )}
                            
                            {post.excerpt && (
                              <p className="text-xs text-base-content/50 mb-3 line-clamp-2">{post.excerpt}</p>
                            )}
                            
                            <a 
                              href={post.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                              onClick={() => markPostAsRead(post.url)}
                            >
                              Read Full Article
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                            </a>
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
                  <p className="text-sm text-base-content/50 mb-4">
                    {patchNotesSearch.trim() 
                      ? `No results for "${patchNotesSearch}"`
                      : `No ${patchNotesFilter === 'all' ? '' : patchNotesFilter.replace('-', ' ') + ' '}posts available`
                    }
                  </p>
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
