import type { CollectionConfig, SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { ServerProps } from '../../config/types.js'
import type { ListPreferences } from '../../preferences/types.js'
import type { ResolvedFilterOptions } from '../../types/index.js'
import type { Column } from '../elements/Table.js'
import type { Data, StaticDescription } from '../types.js'

export type ListViewSlots = {
  AfterList?: React.ReactNode
  AfterListTable?: React.ReactNode
  BeforeList?: React.ReactNode
  BeforeListTable?: React.ReactNode
  Description?: React.ReactNode
  Table: React.ReactNode
}

/**
 * The `ListViewServerPropsOnly` approach is needed to ensure type strictness when injecting component props
 * There is no way to do something like `Omit<ListViewServerProps, keyof ListViewClientProps>`
 * This is because `ListViewClientProps` is a union which is impossible to exclude from
 * Exporting explicitly defined `ListViewServerPropsOnly`, etc. allows for the strictest typing
 */
export type ListViewServerPropsOnly = {
  collectionConfig: SanitizedCollectionConfig
  data: Data
  limit: number
  listPreferences: ListPreferences
  listSearchableFields: CollectionConfig['admin']['listSearchableFields']
} & ServerProps

export type ListViewServerProps = ListViewClientProps & ListViewServerPropsOnly

export type ListViewClientProps = {
  beforeActions?: React.ReactNode[]
  collectionSlug: SanitizedCollectionConfig['slug']
  columnState: Column[]
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections?: boolean
  hasCreatePermission: boolean
  listPreferences?: ListPreferences
  newDocumentURL: string
  preferenceKey?: string
  renderedFilters?: Map<string, React.ReactNode>
  resolvedFilterOptions?: Map<string, ResolvedFilterOptions>
} & ListViewSlots

export type ListViewSlotClientProps = {
  collectionSlug: SanitizedCollectionConfig['slug']
  hasCreatePermission: boolean
  newDocumentURL: string
}

// BeforeList
export type BeforeListClientProps = ListViewSlotClientProps
export type BeforeListServerPropsOnly = {} & ListViewServerPropsOnly
export type BeforeListServerProps = BeforeListClientProps & BeforeListServerPropsOnly

// BeforeListTable
export type BeforeListTableClientProps = ListViewSlotClientProps
export type BeforeListTableServerPropsOnly = {} & ListViewServerPropsOnly
export type BeforeListTableServerProps = BeforeListTableClientProps & BeforeListTableServerPropsOnly

// AfterList
export type AfterListClientProps = ListViewSlotClientProps
export type AfterListServerPropsOnly = {} & ListViewServerPropsOnly
export type AfterListServerProps = AfterListClientProps & AfterListServerPropsOnly

// AfterListTable
export type AfterListTableClientProps = ListViewSlotClientProps
export type AfterListTableServerPropsOnly = {} & ListViewServerPropsOnly
export type AfterListTableServerProps = AfterListTableClientProps & AfterListTableServerPropsOnly

// Description
export type ListDescriptionClientProps = {
  description: StaticDescription
} & ListViewSlotClientProps
export type ListDescriptionServerPropsOnly = {} & ListViewServerPropsOnly
export type ListDescriptionServerProps = ListDescriptionClientProps & ListDescriptionServerPropsOnly
