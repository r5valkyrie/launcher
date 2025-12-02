import React from 'react';

type NewsPost = {
  url: string;
  title: string;
  feature_image?: string;
  published_at?: string;
  excerpt?: string;
  html?: string;
};

type NewsModalProps = {
  open: boolean;
  post: NewsPost | null;
  onClose: () => void;
  getPostCategory: (post: any) => 'patch-notes' | 'community' | 'dev-blog';
};

export default function NewsModal(props: NewsModalProps) {
  const { open, post, onClose, getPostCategory } = props;

  if (!open || !post) return null;

  const category = getPostCategory(post);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'patch-notes': return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'community': return { bg: 'from-purple-500 to-pink-500', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'dev-blog': return { bg: 'from-amber-500 to-orange-500', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      default: return { bg: 'from-base-300 to-base-content/20', text: 'text-base-content/70', badge: 'bg-base-300/50 text-base-content/70 border-white/10' };
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'patch-notes': return 'Patch Notes';
      case 'community': return 'Community';
      case 'dev-blog': return 'Dev Blog';
      default: return cat;
    }
  };

  const colors = getCategoryColor(category);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative glass rounded-2xl w-[900px] max-w-[95vw] max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
          
          {/* Header with Feature Image */}
          <div className="relative flex-shrink-0">
            {post.feature_image ? (
              <div className="relative h-48 md:h-64 overflow-hidden">
                <img 
                  src={post.feature_image} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                
                {/* Category Badge on Image */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colors.badge}`}>
                    {getCategoryLabel(category)}
                  </span>
                </div>
                
                {/* Close Button */}
                <button 
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
                  onClick={onClose}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                
                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{post.title}</h2>
                  {post.published_at && (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>{new Date(post.published_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Header without Image */
              <div className={`bg-gradient-to-r ${colors.bg} p-6 relative`}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative">
                  {/* Close Button */}
                  <button 
                    className="absolute top-0 right-0 w-10 h-10 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all"
                    onClick={onClose}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colors.badge} inline-block mb-3`}>
                    {getCategoryLabel(category)}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 pr-12">{post.title}</h2>
                  {post.published_at && (
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>{new Date(post.published_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 pb-8">
              {post.html ? (
                <article 
                  className="news-content"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                />
              ) : post.excerpt ? (
                <p className="text-base-content/70 leading-relaxed">{post.excerpt}</p>
              ) : (
                <p className="text-base-content/50 italic">No content available for this post.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-white/10 px-6 py-4 bg-base-300/30 flex items-center justify-between gap-4">
            <a 
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm gap-2 text-base-content/60 hover:text-base-content"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View on Blog
            </a>
            <button className="btn btn-primary btn-sm gap-2" onClick={onClose}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
          </div>
        </div>
    </div>
  );
}

