import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Tag } from './Tag';
import { cn } from '@utils';

function ExperienceCard({ experience, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();

  if (!experience) return null;

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{experience.role}</CardTitle>
            <p className="mt-1 text-sm text-[var(--text2)]">
              {experience.organization}
              {experience.organizationDetail ? ` · ${experience.organizationDetail}` : ''}
            </p>
          </div>
          <Tag size="sm">{experience.period}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <Tag variant="lavender" size="sm">
            {experience.type}
          </Tag>
        </div>
      </CardHeader>

      <CardContent>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-[var(--text2)] hover:text-[var(--rose)]"
          aria-label={expanded ? 'Hide details' : 'Show details'}
        >
          <span>{expanded ? 'Hide details' : 'Show details'}</span>
          <ChevronDown size={14} className={cn('transition-transform duration-200', expanded && 'rotate-180')} />
        </button>

        <div
          id={panelId}
          className={cn(
            'grid overflow-hidden transition-all duration-300',
            expanded ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr] mt-0'
          )}
        >
          {expanded ? (
            <ul className="min-h-0 list-disc space-y-1 pl-5 text-sm text-[var(--text2)]">
              {(experience.bullets || []).map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export { ExperienceCard };
