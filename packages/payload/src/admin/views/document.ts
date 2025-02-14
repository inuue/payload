import type { SanitizedPermissions } from '../../auth/types.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadComponent, SanitizedConfig, ServerProps } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { Payload } from '../../index.js'
import type { Data, DocumentSlots, FormState } from '../types.js'
import type { InitPageResult, ViewTypes } from './index.js'

export type EditViewProps = {
  readonly collectionSlug?: string
  readonly globalSlug?: string
}

export type DocumentViewServerPropsOnly = {
  readonly doc: Data
  readonly initPageResult: InitPageResult
  readonly routeSegments: string[]
} & ServerProps

export type DocumentViewServerProps = DocumentViewClientProps & DocumentViewServerPropsOnly

export type DocumentViewClientProps = {
  documentSubViewType: DocumentSubViewTypes
  formState: FormState
  viewType: ViewTypes
} & DocumentSlots

export type DocumentSubViewTypes = 'api' | 'default' | 'livePreview' | 'version' | 'versions'

import type { I18n } from '@payloadcms/translations'

export type DocumentTabProps = {
  readonly apiURL?: string
  readonly collectionConfig?: SanitizedCollectionConfig
  readonly globalConfig?: SanitizedGlobalConfig
  readonly i18n: I18n
  readonly payload: Payload
  readonly permissions: SanitizedPermissions
}

export type DocumentTabCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig: SanitizedGlobalConfig
  permissions: SanitizedPermissions
}) => boolean

// Everything is optional because we merge in the defaults
// i.e. the config may override the `Default` view with a `label` but not an `href`
export type DocumentTabConfig = {
  readonly Component?: DocumentTabComponent
  readonly condition?: DocumentTabCondition
  readonly href?:
    | ((args: {
        apiURL: string
        collection: SanitizedCollectionConfig
        global: SanitizedGlobalConfig
        id?: string
        routes: SanitizedConfig['routes']
      }) => string)
    | string
  readonly isActive?: ((args: { href: string }) => boolean) | boolean
  readonly label?: ((args: { t: (key: string) => string }) => string) | string
  readonly newTab?: boolean
  readonly Pill?: PayloadComponent
}

export type DocumentTabComponent = PayloadComponent<{
  path: string
}>
