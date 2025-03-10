import type { FilterQuery } from 'mongoose'
import type { FlattenedField, Operator, Payload, Where } from 'payload'

import { deepMergeWithCombinedArrays } from 'payload'
import { validOperatorSet } from 'payload/shared'

import { buildAndOrConditions } from './buildAndOrConditions.js'
import { buildSearchParam } from './buildSearchParams.js'

export async function parseParams({
  collectionSlug,
  fields,
  globalSlug,
  locale,
  payload,
  where,
}: {
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  locale: string
  payload: Payload
  where: Where
}): Promise<Record<string, unknown>> {
  let result = {} as FilterQuery<any>

  if (typeof where === 'object') {
    // We need to determine if the whereKey is an AND, OR, or a schema path
    for (const relationOrPath of Object.keys(where)) {
      const condition = where[relationOrPath]
      let conditionOperator: '$and' | '$or'
      if (relationOrPath.toLowerCase() === 'and') {
        conditionOperator = '$and'
      } else if (relationOrPath.toLowerCase() === 'or') {
        conditionOperator = '$or'
      }
      if (Array.isArray(condition)) {
        const builtConditions = await buildAndOrConditions({
          collectionSlug,
          fields,
          globalSlug,
          locale,
          payload,
          where: condition,
        })
        if (builtConditions.length > 0) {
          result[conditionOperator] = builtConditions
        }
      } else {
        // It's a path - and there can be multiple comparisons on a single path.
        // For example - title like 'test' and title not equal to 'tester'
        // So we need to loop on keys again here to handle each operator independently
        const pathOperators = where[relationOrPath]
        if (typeof pathOperators === 'object') {
          const validOperators = Object.keys(pathOperators).filter((operator) =>
            validOperatorSet.has(operator as Operator),
          )
          for (const operator of validOperators) {
            const searchParam = await buildSearchParam({
              collectionSlug,
              fields,
              globalSlug,
              incomingPath: relationOrPath,
              locale,
              operator,
              payload,
              val: pathOperators[operator],
            })

            if (searchParam?.value && searchParam?.path) {
              if (validOperators.length > 1) {
                if (!result.$and) {
                  result.$and = []
                }
                result.$and.push({
                  [searchParam.path]: searchParam.value,
                })
              } else {
                result[searchParam.path] = searchParam.value
              }
            } else if (typeof searchParam?.value === 'object') {
              result = deepMergeWithCombinedArrays(result, searchParam.value, {
                // dont clone Types.ObjectIDs
                clone: false,
              })
            }
          }
        }
      }
    }
  }

  return result
}
