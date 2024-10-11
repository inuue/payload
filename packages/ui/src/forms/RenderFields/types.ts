import type { RenderedField } from 'payload'

export type Props = {
  readonly className?: string
  readonly fields: RenderedField[]
  /**
   * Controls the rendering behavior of the fields, i.e. defers rendering until they intersect with the viewport using the Intersection Observer API.
   *
   * If true, the fields will be rendered immediately, rather than waiting for them to intersect with the viewport.
   *
   * If a number is provided, will immediately render fields _up to that index_.
   */
  readonly forceRender?: boolean
  readonly margins?: 'small' | false
}
