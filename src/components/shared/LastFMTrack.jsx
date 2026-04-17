import { useState, useEffect } from 'react';
import { Music, Play, Pause } from 'lucide-react';

// Last.fm API configuration
const LASTFM_API_KEY = 'cdb1f5b7c60f9d9b86c87f9c2b2d7ae0';
const LASTFM_USER = 'Arknight38';

export function LastFMTrack() {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecentTracks() {
      try {
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch track data');
        }

        const data = await response.json();
        
        if (data.recenttracks && data.recenttracks.track && data.recenttracks.track.length > 0) {
          const recentTrack = data.recenttracks.track[0];
          const isNowPlaying = recentTrack['@attr'] && recentTrack['@attr'].nowplaying === 'true';
          
          setTrack({
            name: recentTrack.name,
            artist: recentTrack.artist['#text'],
            album: recentTrack.album['#text'],
            image: recentTrack.image?.[3]?.['#text'] || recentTrack.image?.[2]?.['#text'] || null,
            url: recentTrack.url,
            isNowPlaying
          });
        } else {
          setTrack(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentTracks();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentTracks, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="lastfm-track loading">
        <Music size={16} className="track-icon" />
        <span className="track-text">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lastfm-track error">
        <Music size={16} className="track-icon" />
        <span className="track-text">Unable to load track</span>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="lastfm-track empty">
        <Music size={16} className="track-icon" />
        <span className="track-text">No recent tracks</span>
      </div>
    );
  }

  return (
    <div className="lastfm-track">
      {track.image && (
        <img 
          src={track.image} 
          alt={`${track.album} cover`} 
          className="track-image"
        />
      )}
      <div className="track-info">
        <div className="track-header">
          {track.isNowPlaying ? (
            <Play size={12} className="track-status playing" />
          ) : (
            <Pause size={12} className="track-status" />
          )}
          <span className="track-status-text">
            {track.isNowPlaying ? 'Now Playing' : 'Last Played'}
          </span>
        </div>
        <div className="track-name">{track.name}</div>
        <div className="track-artist">{track.artist}</div>
        {track.album && <div className="track-album">{track.album}</div>}
      </div>
      {track.url && (
        <a 
          href={track.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="track-link"
          aria-label="View on Last.fm"
        >
          <Music size={14} />
        </a>
      )}
    </div>
  );
}
