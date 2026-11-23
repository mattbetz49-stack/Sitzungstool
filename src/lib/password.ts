export const MIN_PASSWORD = 10

/** Gibt eine deutsche Fehlermeldung zurück oder null, wenn das Passwort passt. `repeat` nur angeben, wenn es verglichen werden soll. */
export function validatePassword(pw: string, repeat?: string): string | null {
  if (pw.trim().length < MIN_PASSWORD) return `Das Passwort braucht mindestens ${MIN_PASSWORD} Zeichen.`
  if (repeat !== undefined && pw !== repeat) return 'Die beiden Passwörter sind nicht gleich.'
  return null
}
