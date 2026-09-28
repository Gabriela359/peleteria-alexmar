// Primitivas visuales compartidas (botón pill, badges de estado, paginador).
// Envuelven las clases de app.css para no repetir className strings largos.

export function Pill({ active, prof, small, className = '', ...props }) {
  const cls = ['pill', prof ? 'prof' : '', small ? 'sm' : '', className].filter(Boolean).join(' ');
  return <button type="button" className={cls} data-active={active ? 'true' : 'false'} {...props} />;
}

const BADGE_CLASS = {
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  danger: 'badge badge-danger',
  neutral: 'badge badge-neutral',
  info: 'badge badge-info',
};

export function Badge({ tone = 'neutral', children }) {
  return <span className={BADGE_CLASS[tone] || BADGE_CLASS.neutral}>{children}</span>;
}

export function Pager({ info, onGo }) {
  return (
    <div className="pager-row">
      <div className="pager-txt">{info.texto}</div>
      <div className="pager-nums">
        <button type="button" className="pager-btn nav" disabled={!info.hayPrev} onClick={() => onGo(Math.max(1, info.pagina - 1))}>Anterior</button>
        {info.paginas.map((n, idx) => (
          <button
            key={idx}
            type="button"
            className={n === '…' ? 'pager-btn dots' : 'pager-btn'}
            data-active={n === info.pagina ? 'true' : 'false'}
            disabled={n === '…'}
            onClick={() => n !== '…' && onGo(n)}
          >
            {n}
          </button>
        ))}
        <button type="button" className="pager-btn nav" disabled={!info.hayNext} onClick={() => onGo(info.pagina + 1)}>Siguiente</button>
      </div>
    </div>
  );
}
