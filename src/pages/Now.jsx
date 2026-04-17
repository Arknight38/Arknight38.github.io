import { useEffect, useState } from 'react';
import { Cpu, BookOpenText, Headphones, Star, NotebookText, User, Github, GitBranch } from 'lucide-react';
import { SEO } from '@components/SEO';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';
import { LastFMTrack } from '@components/shared/LastFMTrack';
import { DiscordStatus } from '@components/shared/DiscordStatus';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

async function fetchWithCache(url, cacheKey) {
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } catch (error) {
    console.error('GitHub API error:', error);
    return cached ? JSON.parse(cached).data : null;
  }
}

const BOOKS = [
  { title: 'Clean Architecture', note: 'Great boundaries and system shape.', rating: '4.5/5' },
  { title: 'Designing Data-Intensive Applications', note: 'Strong mental model for backend systems.', rating: '5/5' },
  { title: 'Pragmatic Programmer', note: 'Solid habits and practical engineering advice.', rating: '4/5' },
];

export function Now() {
  const [repos, setRepos] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // NOW';
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [reposData, activityData] = await Promise.all([
          fetchWithCache('https://api.github.com/users/Arknight38/repos?sort=updated&per_page=5', 'github-repos'),
          fetchWithCache('https://api.github.com/users/Arknight38/events?per_page=5', 'github-activity')
        ]);

        if (reposData) {
          setRepos(reposData);
        }

        if (activityData) {
          const pushEvents = activityData.filter(event => event.type === 'PushEvent').slice(0, 5);
          setActivity(pushEvents);
        }
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      <SEO title="Now" description="What I am currently working on, reading, and listening to." pathname="/now" />
      <ThreeZoneLayout left={<NowWork repos={repos} loading={loading} />} center={<NowFocus />} right={<NowMedia activity={activity} loading={loading} />} />
    </>
  );
}

function NowWork({ repos, loading }) {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <NotebookText size={14} />
          <span className="panel-label">BOOKSHELF</span>
        </div>
        <div className="book-list">
          {BOOKS.map((book) => (
            <div key={book.title} className="book-item">
              <div className="book-title-row">
                <span className="book-title">{book.title}</span>
                <span className="book-rating">
                  <Star size={12} />
                  {book.rating}
                </span>
              </div>
              <p className="book-note">{book.note}</p>
            </div>
          ))}
        </div>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <Github size={14} />
          <span className="panel-label">REPOSITORIES</span>
        </div>
        {loading ? (
          <div className="mini-list">
            <li>Loading repositories...</li>
          </div>
        ) : repos.length === 0 ? (
          <div className="mini-list">
            <li>No repositories found</li>
          </div>
        ) : (
          <div className="repo-list">
            {repos.map((repo) => (
              <div key={repo.id} className="repo-item">
                <div className="repo-header">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-name">
                    {repo.name}
                  </a>
                  <div className="repo-meta">
                    <span className="repo-stars">
                      <Star size={12} />
                      {repo.stargazers_count}
                    </span>
                  </div>
                </div>
                <p className="repo-description">{repo.description || 'No description'}</p>
                {repo.language && (
                  <span className="repo-language">{repo.language}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </ZoneCard>
    </div>
  );
}

function NowFocus() {
  return (
    <ZoneCard variant="focal" className="status-focal">
      <h1 className="status-focal-title">NOW</h1>
      <p className="status-focal-text">
        Building this portfolio into a polished, game-inspired system with better discoverability and stronger
        project storytelling.
      </p>

      <div className="status-focal-content">
        <div className="focus-item">
          <span className="focus-label">PRIMARY FOCUS</span>
          <p className="focus-text">Portfolio development and technical writing</p>
        </div>

        <div className="focus-item">
          <span className="focus-label">LEARNING</span>
          <p className="focus-text">Advanced React patterns, systems programming, and security research</p>
        </div>

        <div className="focus-item">
          <span className="focus-label">ACTIVE PROJECTS</span>
          <ul className="focus-list">
            <li>Kernel-mode driver development</li>
            <li>Reverse engineering tools</li>
            <li>Security research frameworks</li>
          </ul>
        </div>

        <div className="focus-item">
          <span className="focus-label">GOALS</span>
          <ul className="focus-list">
            <li>Complete portfolio writeups</li>
            <li>Expand security research capabilities</li>
            <li>Contribute to open-source projects</li>
          </ul>
        </div>
      </div>
    </ZoneCard>
  );
}

function NowMedia({ activity, loading }) {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <BookOpenText size={14} />
          <span className="panel-label">READING</span>
        </div>
        <ul className="mini-list">
          <li>The </li>
          <li>Systems architecture notes</li>
        </ul>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <Headphones size={14} />
          <span className="panel-label">LISTENING</span>
        </div>
        <LastFMTrack />
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <GitBranch size={14} />
          <span className="panel-label">RECENT ACTIVITY</span>
        </div>
        {loading ? (
          <div className="mini-list">
            <li>Loading activity...</li>
          </div>
        ) : activity.length === 0 ? (
          <div className="mini-list">
            <li>No recent activity</li>
          </div>
        ) : (
          <ul className="activity-list">
            {activity.map((event, index) => (
              <li key={index} className="activity-item">
                <span className="activity-prefix">▸</span>
                <span className="activity-text">
                  pushed to <a href={`https://github.com/${event.repo.name}`} target="_blank" rel="noopener noreferrer" className="activity-repo">{event.repo.name}</a> · {formatRelativeTime(event.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <User size={14} />
          <span className="panel-label">DISCORD</span>
        </div>
        <DiscordStatus />
      </ZoneCard>
    </div>
  );
}
