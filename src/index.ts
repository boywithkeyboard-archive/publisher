import { setFailed } from '@actions/core'
import { action } from './action'

try {
  action()
} catch (err) {
  setFailed(
    err instanceof Error
      ? err.message
      : 'Something unexpected happened.'
  )
}
