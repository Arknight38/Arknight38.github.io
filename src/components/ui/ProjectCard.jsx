import { ArrowUpRight, Github } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './Card';
import { Tag } from './Tag';

function ProjectCard({ project }) {
  if (!project) return null;

  const isExternal = project.linkType === 'github' || /^https?:\/\//.test(project.link || '');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{project.name}</CardTitle>
          <span className="text-[0.7rem] text-[var(--text3)] font-mono uppercase">{project.id}</span>
        </div>
        <p className="text-sm text-[var(--text2)]">{project.description}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(project.tags || []).map((tag) => (
            <Tag key={tag} variant="neutral">
              {tag}
            </Tag>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(project.chips || []).slice(0, 4).map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[var(--border)] bg-[var(--surface2)] px-2.5 py-1 text-[0.72rem] text-[var(--text2)]"
            >
              {chip}
            </span>
          ))}
        </div>
      </CardContent>

      {project.link ? (
        <CardFooter className="flex items-center justify-end">
          <a
            href={project.link}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-[var(--text2)] hover:text-[var(--rose)]"
            aria-label="Open project"
          >
            {project.linkType === 'github' ? <Github size={14} /> : <ArrowUpRight size={14} />}
            <span>Open project</span>
          </a>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export { ProjectCard };
