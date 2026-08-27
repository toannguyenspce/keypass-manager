import type { KeyPass } from '../types/keypass';
import { formatDate, isSafeHttpUrl, orDash } from '../utils/format';
import { PasswordCell } from './PasswordCell';
import { PencilIcon, TrashIcon } from './Icons';

type ResultsViewProps = {
  items: KeyPass[];
  revealedIds: ReadonlySet<string>;
  onToggleReveal: (id: string, next: boolean) => void;
  onEdit: (entry: KeyPass) => void;
  onDelete: (entry: KeyPass) => void;
};

function UrlValue({ url }: { url: string }) {
  if (!url) return <span className="muted">—</span>;
  if (!isSafeHttpUrl(url)) return <span className="wrap">{url}</span>;
  return (
    <a className="wrap" href={url} target="_blank" rel="noreferrer noopener">
      {url}
    </a>
  );
}

function RowActions({
  entry,
  onEdit,
  onDelete,
}: Pick<ResultsViewProps, 'onEdit' | 'onDelete'> & { entry: KeyPass }) {
  return (
    <div className="row-actions">
      <button
        type="button"
        className="button ghost"
        onClick={() => onEdit(entry)}
        aria-label={`Edit ${entry.title}`}
      >
        <PencilIcon />
        <span>Edit</span>
      </button>
      <button
        type="button"
        className="button ghost danger"
        onClick={() => onDelete(entry)}
        aria-label={`Delete ${entry.title}`}
      >
        <TrashIcon />
        <span>Delete</span>
      </button>
    </div>
  );
}

/**
 * Search results: a table on desktop and stacked cards on narrow screens. Both
 * render from the same data; CSS decides which one is visible.
 */
export function ResultsView({
  items,
  revealedIds,
  onToggleReveal,
  onEdit,
  onDelete,
}: ResultsViewProps) {
  return (
    <>
      <div className="table-scroll desktop-only">
        <table className="results-table">
          <caption className="sr-only">
            KeyPass search results. Passwords are masked until revealed per entry.
          </caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Group</th>
              <th scope="col">Username</th>
              <th scope="col">Password</th>
              <th scope="col">URL</th>
              <th scope="col">Notes</th>
              <th scope="col">Created</th>
              <th scope="col">Updated</th>
              <th scope="col">Entry ID</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => (
              <tr key={entry.id}>
                <th scope="row" className="wrap">{orDash(entry.title)}</th>
                <td className="wrap">{orDash(entry.group)}</td>
                <td className="wrap">{orDash(entry.username)}</td>
                <td>
                  <PasswordCell
                    entry={entry}
                    revealed={revealedIds.has(entry.id)}
                    onToggle={onToggleReveal}
                  />
                </td>
                <td><UrlValue url={entry.url ?? ''} /></td>
                <td className="wrap notes">{orDash(entry.notes)}</td>
                <td className="nowrap">{formatDate(entry.createdAt)}</td>
                <td className="nowrap">{formatDate(entry.updatedAt)}</td>
                <td><code className="entry-id">{entry.id}</code></td>
                <td><RowActions entry={entry} onEdit={onEdit} onDelete={onDelete} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="card-list mobile-only" aria-label="KeyPass search results">
        {items.map((entry) => (
          <li className="entry-card" key={entry.id}>
            <h3 className="entry-card-title">{orDash(entry.title)}</h3>
            <dl className="entry-card-fields">
              <dt>Group</dt>
              <dd className="wrap">{orDash(entry.group)}</dd>
              <dt>Username</dt>
              <dd className="wrap">{orDash(entry.username)}</dd>
              <dt>Password</dt>
              <dd>
                <PasswordCell
                  entry={entry}
                  revealed={revealedIds.has(entry.id)}
                  onToggle={onToggleReveal}
                />
              </dd>
              <dt>URL</dt>
              <dd><UrlValue url={entry.url ?? ''} /></dd>
            </dl>
            <details className="entry-card-details">
              <summary>More details</summary>
              <dl className="entry-card-fields">
                <dt>Notes</dt>
                <dd className="wrap">{orDash(entry.notes)}</dd>
                <dt>Created</dt>
                <dd>{formatDate(entry.createdAt)}</dd>
                <dt>Updated</dt>
                <dd>{formatDate(entry.updatedAt)}</dd>
                <dt>Entry ID</dt>
                <dd><code className="entry-id">{entry.id}</code></dd>
              </dl>
            </details>
            <RowActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </>
  );
}
