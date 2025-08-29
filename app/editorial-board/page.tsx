import React from 'react'
import { editorialMembers, groupEditorialMembers } from '@/data/editorial-board'
import { OrcidBadge } from '@/components/orcid-badge'

export const metadata = {
  title: 'Editorial Board | AMHSJ'
}

const CATEGORY_LABELS: Record<string, string> = {
  'editor-in-chief': 'Editor-in-Chief',
  'managing-editor': 'Deputy Editor-in-Chief',
  'associate-editor': 'Editors',
  'section-editor': 'Section Editors',
  'advisory': 'Advisory Board',
  'international-advisory': 'International Editorial Advisory Board'
}

export default function EditorialBoardPage() {
  const grouped = groupEditorialMembers()
  const order = [
    'editor-in-chief',
    'managing-editor',
    'associate-editor',
    'section-editor',
    'advisory',
    'international-advisory'
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-serif font-bold text-blue-900 mb-6">Editorial & Advisory Board</h1>
        <p className="text-gray-700 mb-10 max-w-3xl leading-relaxed text-sm">
          AMHSJ maintains a structured editorial and international advisory framework to ensure rigorous, ethical and
          contextually relevant peer review. Profiles will be updated with full credentials, affiliations and ORCID identifiers as they are confirmed.
        </p>

        {order.map(cat => {
          const members = grouped[cat]
          if (!members || members.length === 0) return null
          return (
            <section key={cat} className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
                {CATEGORY_LABELS[cat] || cat}
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {members.map(m => (
                  <article key={m.id} className="bg-white rounded-lg border shadow-sm p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-blue-800">
                        {m.fullName}
                        {m.credentials.length > 0 && (
                          <span className="block text-xs font-normal text-gray-600 mt-0.5">
                            {m.credentials.join(', ')}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-700 font-medium">{m.displayTitle}</p>
                      <p className="text-xs text-gray-500">{m.affiliation}</p>
                      <div className="mt-1"><OrcidBadge orcid={m.orcid} /></div>
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed space-y-2">
                      <p>{m.bio}</p>
                      {m.researchInterests && (
                        <p><span className="font-semibold">Research Interests: </span>{m.researchInterests.join('; ')}.</p>
                      )}
                      {m.roles && (
                        <ul className="list-disc ml-5 space-y-1">
                          {m.roles.map(r => <li key={r}>{r}</li>)}
                        </ul>
                      )}
                    </div>
                    {m.regionsOfWork && (
                      <div className="flex flex-wrap gap-2 mt-auto pt-2">
                        {m.regionsOfWork.map(r => (
                          <span key={r} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
