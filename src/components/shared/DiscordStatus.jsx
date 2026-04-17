import { useState, useEffect } from 'react';
import { Gamepad2, Music, Clock, User } from 'lucide-react';

const DISCORD_USER_ID = '1187827395152060518';

export function DiscordStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDiscordStatus() {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
        const { data } = await res.json();
        
        setStatus({
          discordStatus: data.discord_status,
          spotify: data.spotify,
          activity: data.activities?.[0],
          username: data.discord_user?.username,
          discriminator: data.discord_user?.discriminator,
          avatar: data.discord_user?.avatar,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDiscordStatus();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchDiscordStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="discord-status loading">
        <User size={16} className="status-icon" />
        <span className="status-text">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="discord-status error">
        <User size={16} className="status-icon" />
        <span className="status-text">Unable to load status</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="discord-status offline">
        <User size={16} className="status-icon" />
        <span className="status-text">Offline</span>
      </div>
    );
  }

  const statusColors = {
    online: 'var(--green)',
    idle: 'var(--yellow)',
    dnd: 'var(--rose)',
    offline: 'var(--text3)',
  };

  const statusLabels = {
    online: 'ONLINE',
    idle: 'IDLE',
    dnd: 'DO NOT DISTURB',
    offline: 'OFFLINE',
  };

  return (
    <div className="discord-status">
      <div className="discord-header">
        <div className="discord-user">
          {status.avatar && (
            <img
              src={`https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${status.avatar}.png`}
              alt="Avatar"
              className="discord-avatar"
            />
          )}
          <div className="discord-user-info">
            <span className="discord-username">
              {status.username}
              {status.discriminator && `#${status.discriminator}`}
            </span>
            <div className="discord-status-badge" style={{ color: statusColors[status.discordStatus] }}>
              <div className={`status-dot ${status.discordStatus}`} />
              <span className="status-label">{statusLabels[status.discordStatus]}</span>
            </div>
          </div>
        </div>
      </div>

      {status.activity && (
        <div className="discord-activity">
          <Gamepad2 size={14} className="activity-icon" />
          <div className="activity-info">
            <span className="activity-name">{status.activity.name}</span>
            {status.activity.state && (
              <span className="activity-state">{status.activity.state}</span>
            )}
            {status.activity.details && (
              <span className="activity-details">{status.activity.details}</span>
            )}
          </div>
        </div>
      )}

      {status.spotify && (
        <div className="discord-spotify">
          <Music size={14} className="spotify-icon" />
          <div className="spotify-info">
            <span className="spotify-track">{status.spotify.track_name}</span>
            <span className="spotify-artist">{status.spotify.artist}</span>
            <span className="spotify-album">{status.spotify.album}</span>
          </div>
        </div>
      )}
    </div>
  );
}
