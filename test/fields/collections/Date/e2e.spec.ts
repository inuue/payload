import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { dateFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

const londonTimezone = 'Europe/London'

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Date', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, dateFieldsSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should display formatted date in list view table cell', async () => {
    await page.goto(url.list)
    const formattedDateCell = page.locator('.row-1 .cell-timeOnly')
    await expect(formattedDateCell).toContainText(' Aug ')

    const notFormattedDateCell = page.locator('.row-1 .cell-default')
    await expect(notFormattedDateCell).toContainText('August')
  })

  test('should display formatted date in useAsTitle', async () => {
    await page.goto(url.list)
    await page.locator('.row-1 .cell-default a').click()
    await expect(page.locator('.doc-header__title.render-title')).toContainText('August')
  })

  test('should clear date', async () => {
    await page.goto(url.create)
    const dateField = page.locator('#field-default input')
    await expect(dateField).toBeVisible()
    await dateField.fill('02/07/2023')
    await expect(dateField).toHaveValue('02/07/2023')
    await saveDocAndAssert(page)

    const clearButton = page.locator('#field-default .date-time-picker__clear-button')
    await expect(clearButton).toBeVisible()
    await clearButton.click()
    await expect(dateField).toHaveValue('')
  })

  describe('localized dates', () => {
    describe('EST', () => {
      test.use({
        geolocation: {
          latitude: 42.3314,
          longitude: -83.0458,
        },
        timezoneId: 'America/Detroit',
      })
      test('create EST day only date', async () => {
        await page.goto(url.create)
        await page.waitForURL(`**/${url.create}`)
        const dateField = page.locator('#field-default input')

        // enter date in default date field
        await dateField.fill('02/07/2023')
        await saveDocAndAssert(page)

        // get the ID of the doc
        const routeSegments = page.url().split('/')
        const id = routeSegments.pop()

        // fetch the doc (need the date string from the DB)
        const { doc } = await client.findByID({ id: id!, auth: true, slug: 'date-fields' })

        await expect(() => {
          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        }).toPass({ timeout: 10000, intervals: [100] })
      })
    })

    describe('PST', () => {
      test.use({
        geolocation: {
          latitude: 37.774929,
          longitude: -122.419416,
        },
        timezoneId: 'America/Los_Angeles',
      })

      test('create PDT day only date', async () => {
        await page.goto(url.create)
        await page.waitForURL(`**/${url.create}`)
        const dateField = page.locator('#field-default input')

        // enter date in default date field
        await dateField.fill('02/07/2023')
        await saveDocAndAssert(page)

        // get the ID of the doc
        const routeSegments = page.url().split('/')
        const id = routeSegments.pop()

        // fetch the doc (need the date string from the DB)
        const { doc } = await client.findByID({ id: id!, auth: true, slug: 'date-fields' })

        await expect(() => {
          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        }).toPass({ timeout: 10000, intervals: [100] })
      })
    })

    describe('ST', () => {
      test.use({
        geolocation: {
          latitude: -14.5994,
          longitude: -171.857,
        },
        timezoneId: 'Pacific/Apia',
      })

      test('create ST day only date', async () => {
        await page.goto(url.create)
        await page.waitForURL(`**/${url.create}`)
        const dateField = page.locator('#field-default input')

        // enter date in default date field
        await dateField.fill('02/07/2023')
        await saveDocAndAssert(page)

        // get the ID of the doc
        const routeSegments = page.url().split('/')
        const id = routeSegments.pop()

        // fetch the doc (need the date string from the DB)
        const { doc } = await client.findByID({ id: id!, auth: true, slug: 'date-fields' })

        await expect(() => {
          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        }).toPass({ timeout: 10000, intervals: [100] })
      })
    })
  })

  describe('dates with timezones', () => {
    /**
     * For now we can only configure one timezone for this entire test suite because the .use is not isolating it per test block
     * The last .use options always overrides the rest
     *
     * See: https://github.com/microsoft/playwright/issues/27138
     */
    test.use({
      timezoneId: londonTimezone,
    })

    test('should display the value in the selected time', async () => {
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const expectedValue = 'Aug 12, 2027 10:00 AM' // This is the seeded value for 10AM at Asia/Tokyo time
      const expectedUTCValue = '2027-08-12T01:00:00.000Z' // This is the expected UTC value for the above
      const expectedTimezone = 'Asia/Tokyo'

      await expect(dateTimeLocator).toHaveValue(expectedValue)

      await expect(() => {
        expect(existingDoc?.dayAndTimeWithTimezone).toEqual(expectedUTCValue)
        expect(existingDoc?.dayAndTimeWithTimezone_tz).toEqual(expectedTimezone)
      }).toPass({ timeout: 10000, intervals: [100] })
    })

    test('changing the timezone should update the date to the new equivalent', async () => {
      // Tests to see if the date value is updated when the timezone is changed,
      // it should change to the equivalent time in the new timezone as the UTC value remains the same
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const initialDateValue = await dateTimeLocator.inputValue()

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`

      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("London")`

      await page.click(dropdownControlSelector)

      await page.click(timezoneOptionSelector)

      // todo: fix
      await expect(dateTimeLocator).not.toHaveValue(initialDateValue)
    })

    test('can change timezone inside a block', async () => {
      // Tests to see if the date value is updated when the timezone is changed,
      // it should change to the equivalent time in the new timezone as the UTC value remains the same
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-timezoneBlocks__0__dayAndTime .react-datepicker-wrapper input',
      )

      const initialDateValue = await dateTimeLocator.inputValue()

      const dropdownControlSelector = `#field-timezoneBlocks__0__dayAndTime .rs__control`

      const timezoneOptionSelector = `#field-timezoneBlocks__0__dayAndTime .rs__menu .rs__option:has-text("London")`

      await page.click(dropdownControlSelector)

      await wait(250)

      await page.click(timezoneOptionSelector)

      await expect(dateTimeLocator).not.toHaveValue(initialDateValue)
    })

    test('can change timezone inside an array', async () => {
      // Tests to see if the date value is updated when the timezone is changed,
      // it should change to the equivalent time in the new timezone as the UTC value remains the same
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-timezoneArray__0__dayAndTime .react-datepicker-wrapper input',
      )

      const initialDateValue = await dateTimeLocator.inputValue()

      const dropdownControlSelector = `#field-timezoneArray__0__dayAndTime .rs__control`

      const timezoneOptionSelector = `#field-timezoneArray__0__dayAndTime .rs__menu .rs__option:has-text("London")`

      await page.click(dropdownControlSelector)

      await page.click(timezoneOptionSelector)

      await expect(dateTimeLocator).not.toHaveValue(initialDateValue)
    })

    test('can see custom timezone in timezone picker', async () => {
      // Tests to see if the date value is updated when the timezone is changed,
      // it should change to the equivalent time in the new timezone as the UTC value remains the same
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`

      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Monterrey")`

      await page.click(dropdownControlSelector)

      const timezoneOption = page.locator(timezoneOptionSelector)

      await expect(timezoneOption).toBeVisible()
    })

    test('can see default timezone in timezone picker', async () => {
      await page.goto(url.create)

      const selectedTimezoneSelector = `#field-dayAndTimeWithTimezone .rs__value-container`

      const selectedTimezone = page.locator(selectedTimezoneSelector)

      await expect(selectedTimezone).toContainText('Monterrey')
    })

    describe('while timezone is set to London', () => {
      test('displayed value should be the same while timezone is set to London', async () => {
        const {
          docs: [existingDoc],
        } = await payload.find({
          collection: dateFieldsSlug,
        })

        await page.goto(url.edit(existingDoc!.id))

        const result = await page.evaluate(() => {
          return Intl.DateTimeFormat().resolvedOptions().timeZone
        })

        await expect(() => {
          // Confirm that the emulated timezone is set to London
          expect(result).toEqual(londonTimezone)
        }).toPass({ timeout: 10000, intervals: [100] })

        const dateTimeLocator = page.locator(
          '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
        )

        const expectedValue = 'Aug 12, 2027 10:00 AM' // This is the seeded value for 10AM at Asia/Tokyo time

        await expect(dateTimeLocator).toHaveValue(expectedValue)
      })
    })
  })
})
