import { useApp } from '../state/store';

export default function Toast() {
  const { state } = useApp();
  if (!state.toast) return null;
  return <div className="toast">{state.toast}</div>;
}
