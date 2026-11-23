import { describe, it, expect } from 'vitest'
import { validatePassword } from './password'

describe('validatePassword', () => {
  it('akzeptiert 10+ Zeichen', () => { expect(validatePassword('abcdefghij')).toBeNull() })
  it('lehnt zu kurze Passwörter ab', () => { expect(validatePassword('kurz')).toBe('Das Passwort braucht mindestens 10 Zeichen.') })
  it('9 Zeichen sind zu kurz, Grenze genau 10', () => {
    expect(validatePassword('123456789')).not.toBeNull(); expect(validatePassword('1234567890')).toBeNull()
  })
  it('Leerzeichen am Rand zählen nicht mit', () => { expect(validatePassword('   abc     ')).not.toBeNull() })
  it('Wiederholung muss übereinstimmen', () => {
    expect(validatePassword('abcdefghij', 'abcdefghiX')).toBe('Die beiden Passwörter sind nicht gleich.')
    expect(validatePassword('abcdefghij', 'abcdefghij')).toBeNull()
  })
})
