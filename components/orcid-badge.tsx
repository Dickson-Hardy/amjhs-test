import React from 'react'

export function OrcidBadge({ orcid }: { orcid?: string }) {
  if (!orcid) return null
  return (
    <a
      href={`https://orcid.org/${orcid}`}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-xs font-medium"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-4 w-4" aria-hidden="true">
        <circle cx="128" cy="128" r="128" fill="#A6CE39" />
        <path fill="#fff" d="M86.3 186.2H70.9V70.1h15.4v116.1zM108.9 70.1h41.4c39 0 64.7 24.9 64.7 58.8v.3c0 33.9-25.8 59-64.7 59h-41.4V70.1zm41.4 101.2c29.1 0 48.4-18.5 48.4-42.1v-.3c0-23.6-19.3-42.4-48.4-42.4h-26v84.8h26zM70 213.3c0-5.9 4.6-10.6 10.8-10.6 6.2 0 10.7 4.7 10.7 10.6 0 5.8-4.5 10.6-10.8 10.6-6.1 0-10.7-4.8-10.7-10.6z" />
      </svg>
      {orcid}
    </a>
  )
}
