import React from 'react';

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

  return (
    <div className="xl:col-span-2 space-y-6">

      {/* Main Controls */}
      <div className="glass rounded-xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Info Section */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-info to-cyan-500 flex items-center justify-center">
              <span className="text-white text-sm">📰</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Latest Updates</h3>
              {!!(filteredPatchPosts && filteredPatchPosts.length) && (
                <p className="text-xs opacity-70">{filteredPatchPosts.length} post{filteredPatchPosts.length !== 1 ? 's' : ''} available</p>
              )}
            </div>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 bg-base-200/50 rounded-lg">
              <button 
                className={`btn btn-sm ${patchNotesView === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPatchNotesView('grid')}
                title="Grid View"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button 
                className={`btn btn-sm ${patchNotesView === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPatchNotesView('timeline')}
                title="Timeline View"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
            
            <a className="btn btn-primary btn-sm gap-2" href={`https://blog.playvalkyrie.org/`} target="_blank" rel="noreferrer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Visit Blog
            </a>
          </div>
        </div>

        <div className="divider divider-horizontal opacity-30 my-6"></div>

        {/* Filter Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Categories</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              className={`btn btn-sm ${patchNotesFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPatchNotesFilter('all')}
            >
              All Posts
            </button>
            <button 
              className={`btn btn-sm ${patchNotesFilter === 'community' ? 'btn-primary' : 'btn-outline'} gap-2`}
              onClick={() => setPatchNotesFilter('community')}
            >
              Community
            </button>
            <button 
              className={`btn btn-sm ${patchNotesFilter === 'patch-notes' ? 'btn-primary' : 'btn-outline'} gap-2`}
              onClick={() => setPatchNotesFilter('patch-notes')}
            >
              Patch Notes
            </button>
            <button 
              className={`btn btn-sm ${patchNotesFilter === 'dev-blog' ? 'btn-primary' : 'btn-outline'} gap-2`}
              onClick={() => setPatchNotesFilter('dev-blog')}
            >
              Dev Blog
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Search</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search news and updates..." 
              className="input input-bordered w-full pr-10"
              value={patchNotesSearch}
              onChange={(e) => setPatchNotesSearch(e.target.value)}
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="glass rounded-xl p-6 min-h-[400px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-emerald-500 flex items-center justify-center">
            <span className="text-white text-sm">📄</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Posts</h3>
            <p className="text-xs opacity-70">Latest news and updates from the community</p>
          </div>
        </div>
        {patchLoading && (
          <div className={patchNotesView === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`ps-${i}`} className="glass-soft rounded-xl overflow-hidden border border-white/10 animate-pulse">
                {patchNotesView === 'grid' && <div className="w-full pb-[40%] bg-base-300/50" />}
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-base-300/60 rounded w-3/4" />
                  <div className="h-3 bg-base-300/40 rounded w-full" />
                  <div className="h-3 bg-base-300/40 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!patchLoading && (
          <>
            {patchNotesView === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPatchPosts.map((post) => {
                  const category = getPostCategory(post);
                  const isRead = readPosts.has(post.url);
                  const isFavorite = favoritePosts.has(post.url);
                  
                  return (
                    <div key={post.url} className={`group rounded-xl overflow-hidden glass border transition-all hover:shadow-lg ${isRead ? 'border-white/5 opacity-75' : 'border-white/10 hover:border-primary/40'}`}>
                      <div className="relative w-full pb-[40%] bg-base-300">
                        {post.feature_image ? (
                          <img loading="lazy" src={post.feature_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-xs opacity-60">
                            {category === 'patch-notes' ? '📋' : category === 'community' ? '👥' : '🛠️'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Category Badge */}
                        <div className="absolute top-2 left-2">
                          <span className={`badge badge-sm ${category === 'patch-notes' ? 'badge-primary' : category === 'community' ? 'badge-secondary' : 'badge-accent'}`}>
                            {category === 'patch-notes' ? 'Patch' : category === 'community' ? 'Community' : 'Dev Blog'}
                          </span>
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost'}`}
                            onClick={(e) => { e.preventDefault(); toggleFavoritePost(post.url); }}
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            ⭐
                          </button>
                        </div>

                        {!isRead && (
                          <div className="absolute bottom-2 left-2">
                            <span className="badge badge-xs badge-info">New</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <h4 className="font-semibold text-sm mb-2 line-clamp-2">{post.title}</h4>
                        <div className="flex items-center gap-2 text-xs opacity-60 mb-2">
                          {post.published_at && (
                            <span>{new Date(post.published_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          )}
                        </div>
                        {post.excerpt && (
                          <p className="text-xs opacity-80 line-clamp-3 mb-3">{post.excerpt}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-xs btn-primary"
                            onClick={() => markPostAsRead(post.url)}
                          >
                            Read More
                          </a>
                          {isFavorite && <span className="text-xs opacity-50">⭐ Favorited</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPatchPosts.map((post, index) => {
                  const category = getPostCategory(post);
                  const isRead = readPosts.has(post.url);
                  const isFavorite = favoritePosts.has(post.url);
                  
                  return (
                    <div key={post.url} className={`flex gap-4 p-4 rounded-xl glass border transition-all hover:shadow-md ${isRead ? 'border-white/5 opacity-75' : 'border-white/10 hover:border-primary/30'}`}>
                      {/* Timeline Indicator */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${category === 'patch-notes' ? 'bg-primary' : category === 'community' ? 'bg-secondary' : 'bg-accent'}`}></div>
                        {index < filteredPatchPosts.length - 1 && <div className="w-px h-full bg-white/10 mt-2"></div>}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">{post.title}</h4>
                            <span className={`badge badge-xs ${category === 'patch-notes' ? 'badge-primary' : category === 'community' ? 'badge-secondary' : 'badge-accent'}`}>
                              {category === 'patch-notes' ? 'Patch' : category === 'community' ? 'Community' : 'Dev Blog'}
                            </span>
                            {!isRead && <span className="badge badge-xs badge-info">New</span>}
                            {isFavorite && <span className="text-xs">⭐</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className={`btn btn-xs btn-circle ${isFavorite ? 'btn-warning' : 'btn-ghost'}`}
                              onClick={() => toggleFavoritePost(post.url)}
                              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              ⭐
                            </button>
                          </div>
                        </div>
                        
                        {post.published_at && (
                          <div className="text-xs opacity-60 mb-2">
                            {new Date(post.published_at).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                        
                        {post.excerpt && (
                          <p className="text-xs opacity-80 mb-3 line-clamp-2">{post.excerpt}</p>
                        )}
                        
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-xs btn-outline"
                          onClick={() => markPostAsRead(post.url)}
                        >
                          Read Full Article →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredPatchPosts.length === 0 && !patchLoading && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📰</div>
                <h4 className="text-lg font-semibold mb-2">No posts found</h4>
                <p className="text-sm opacity-70 mb-4">
                  {patchNotesSearch.trim() 
                    ? `No posts match "${patchNotesSearch}"`
                    : `No ${patchNotesFilter === 'all' ? '' : patchNotesFilter + ' '}posts available`
                  }
                </p>
                {patchNotesSearch.trim() && (
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => setPatchNotesSearch('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
