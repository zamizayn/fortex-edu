import React, { useEffect, useState } from 'react';
import { SocialPost, SiteSettings } from '../types';
import { getSiteSettings } from '../services/db';

const posts: SocialPost[] = [
  { id: '1', imageUrl: 'https://picsum.photos/id/11/400/400', caption: 'Dreaming of a nursing career? Check our latest roadmap!', likes: 245 },
  { id: '2', imageUrl: 'https://picsum.photos/id/12/400/400', caption: 'Success story: Rahul joined MLT through Fortex. Proud!', likes: 189 },
  { id: '3', imageUrl: 'https://picsum.photos/id/13/400/400', caption: 'Meet us at Wayanad office for free career mapping.', likes: 120 },
  { id: '4', imageUrl: 'https://picsum.photos/id/14/400/400', caption: 'Motivational Monday: Your future self will thank you.', likes: 310 },
];

const SocialFeed: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
      <div className="mb-16 text-center">
        <p className="text-[10px] font-medium text-accent uppercase tracking-[0.3em] mb-4">Social Presence</p>
        <h3 className="text-4xl md:text-6xl font-semibold text-charcoal tracking-tight">Lens on Excellence.</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {posts.map(post => (
          <div key={post.id} className="relative aspect-square group overflow-hidden rounded-[2.5rem] shadow-2xl shadow-black/5 bg-gray-50 border border-black/5">
            <img src={post.imageUrl} alt="Social" className="w-full h-full object-cover grayscale opacity-70 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110" />
            <div className="absolute inset-x-0 bottom-0 p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl text-charcoal">
                <p className="text-[10px] font-medium leading-tight line-clamp-2 mb-3">{post.caption}</p>
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-accent">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                  {post.likes}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {settings?.instagram && (
        <div className="mt-20 text-center">
          <a
            href={settings.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-charcoal text-white rounded-2xl font-medium shadow-2xl hover:bg-black transition-all group"
          >
            Explore our Instagram
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
