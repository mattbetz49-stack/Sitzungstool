import AgendaEditor from '../components/AgendaEditor'
export default function AdminTemplate() {
  return (<>
    <h2>Standardvorlage der Tagesordnung</h2>
    <p className="muted">Diese Vorlage wird bei jeder neuen Sitzung kopiert. Änderungen wirken nur auf neue Sitzungen.</p>
    <AgendaEditor />
  </>)
}
