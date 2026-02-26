
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getSiteSettings } from '../services/db';
import { EducationInsight, SiteSettings } from '../types';

const VideoGallery: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [insights, setInsights] = useState<EducationInsight[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [querySnapshot, fetchedSettings] = await Promise.all([
          getDocs(collection(db, 'education-insights')),
          getSiteSettings()
        ]);

        const fetchedInsights = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EducationInsight));

        setInsights(fetchedInsights);
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div className="py-12 md:py-32 max-w-7xl mx-auto px-6 lg:px-12">
    <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 md:gap-10 pb-8 md:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {[1, 2, 3].map(i => <div key={i} className="flex-none w-[85vw] sm:w-[60vw] md:w-auto aspect-video rounded-[2.5rem] bg-gray-200 animate-pulse" />)}
    </div>
  </div>;
  if (insights.length === 0) return null;

  return (
    <section id="media" className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-32 bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-medium text-accent uppercase tracking-[0.3em]">Insights & Media</p>
          <h3 className="text-4xl md:text-6xl font-semibold text-charcoal tracking-tight">Curated Knowledge.</h3>
        </div>
        <a
          href={settings?.youtubeUrl || "https://youtube.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 px-8 py-4 bg-gray-50 rounded-2xl text-charcoal font-semibold text-sm transition-all hover:bg-red-50 hover:text-red-600"
        >
          Explore Channel
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
        </a>
      </div>

      <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 md:gap-10 pb-4 md:pb-0 snap-x snap-mandatory md:snap-none -mx-6 px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {insights.map(insight => {
          const videoId = getYoutubeId(insight.youtubeLink);
          if (!videoId) return null;

          return (
            <div key={insight.id} className="group cursor-pointer flex-none w-[85vw] sm:w-[60vw] md:w-auto snap-center md:snap-align-none" onClick={() => setActiveVideo(videoId)}>
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5 mb-8 bg-gray-100 border border-black/5">
                <img
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt={insight.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group-hover:bg-accent group-hover:border-accent transition-all duration-500 shadow-2xl">
                    <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute top-6 left-6">
                  {insight.serviceTag && (
                    <span className="px-5 py-2 bg-black/20 backdrop-blur-xl border border-white/10 text-white text-[10px] font-medium uppercase rounded-full tracking-widest">{insight.serviceTag}</span>
                  )}
                </div>
              </div>
              <h4 className="font-semibold text-xl text-charcoal group-hover:text-accent transition-colors leading-tight tracking-tight px-2">{insight.name}</h4>
            </div>
          );
        })}
      </div>

      {activeVideo && (
        <div
          className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500"
          onClick={() => setActiveVideo(null)}
        >
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[3rem] overflow-hidden shadow-3xl">
            <button
              className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 z-10 transition-all"
              onClick={() => setActiveVideo(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoGallery;
