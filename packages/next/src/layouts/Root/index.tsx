import type { AcceptedLanguages } from '@payloadcms/translations'
import type { CustomVersionParser, ImportMap, SanitizedConfig, ServerFunctionClient } from 'payload'

import { rtlLanguages } from '@payloadcms/translations'
import { RootProvider } from '@payloadcms/ui'
import '@payloadcms/ui/scss/app.scss'
import { headers as getHeaders, cookies as nextCookies } from 'next/headers.js'
import { checkDependencies, parseCookies } from 'payload'
import React from 'react'

import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getPayloadHMR } from '../../utilities/getPayloadHMR.js'
import { getRequestLanguage } from '../../utilities/getRequestLanguage.js'
import { getRequestTheme } from '../../utilities/getRequestTheme.js'
import { initReq } from '../../utilities/initReq.js'

export const metadata = {
  description: 'Generated by Next.js',
  title: 'Next.js',
}

const customReactVersionParser: CustomVersionParser = (version) => {
  const [mainVersion, ...preReleases] = version.split('-')

  if (preReleases?.length === 3) {
    // Needs different handling, as it's in a format like 19.0.0-rc-06d0b89e-20240801 format
    const date = preReleases[2]

    const parts = mainVersion.split('.').map(Number)
    return { parts, preReleases: [date] }
  }

  const parts = mainVersion.split('.').map(Number)
  return { parts, preReleases }
}

let checkedDependencies = false

export const RootLayout = async ({
  children,
  config: configPromise,
  serverFunction,
}: {
  readonly children: React.ReactNode
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly serverFunction: ServerFunctionClient
}) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_DISABLE_DEPENDENCY_CHECKER !== 'true' &&
    !checkedDependencies
  ) {
    // eslint-disable-next-line react-compiler/react-compiler
    checkedDependencies = true
    // First check if there are mismatching dependency versions of next / react packages
    await checkDependencies({
      dependencyGroups: [
        {
          name: 'react',
          dependencies: ['react', 'react-dom'],
          targetVersionDependency: 'react',
        },
      ],
      dependencyVersions: {
        next: {
          required: false,
          version: '>=15.0.0-canary.173',
        },
        react: {
          customVersionParser: customReactVersionParser,
          required: false,
          version: '>=19.0.0-rc-3edc000d-20240926',
        },
        'react-dom': {
          customVersionParser: customReactVersionParser,
          required: false,
          version: '>=19.0.0-rc-3edc000d-20240926',
        },
      },
    })
  }

  const config = await configPromise

  const headers = await getHeaders()
  const cookies = parseCookies(headers)

  const languageCode = getRequestLanguage({
    config,
    cookies,
    headers,
  })

  const theme = getRequestTheme({
    config,
    cookies,
    headers,
  })

  const payload = await getPayloadHMR({ config })

  const { i18n, permissions, req, user } = await initReq(config)

  const dir = (rtlLanguages as unknown as AcceptedLanguages[]).includes(languageCode)
    ? 'RTL'
    : 'LTR'

  const languageOptions = Object.entries(config.i18n.supportedLanguages || {}).reduce(
    (acc, [language, languageConfig]) => {
      if (Object.keys(config.i18n.supportedLanguages).includes(language)) {
        acc.push({
          label: languageConfig.translations.general.thisLanguage,
          value: language,
        })
      }

      return acc
    },
    [],
  )

  async function switchLanguageServerAction(lang: string): Promise<void> {
    'use server'
    const cookies = await nextCookies()
    cookies.set({
      name: `${config.cookiePrefix || 'payload'}-lng`,
      path: '/',
      value: lang,
    })
  }

  const navPreferences = user
    ? (
        await payload.find({
          collection: 'payload-preferences',
          depth: 0,
          limit: 1,
          req,
          user,
          where: {
            and: [
              {
                key: {
                  equals: 'nav',
                },
              },
              {
                'user.relationTo': {
                  equals: user.collection,
                },
              },
              {
                'user.value': {
                  equals: user.id,
                },
              },
            ],
          },
        })
      )?.docs?.[0]
    : null

  const isNavOpen = navPreferences?.value?.open ?? true

  const clientConfig = await getClientConfig({
    config,
    i18n,
  })

  return (
    <html data-theme={theme} dir={dir} lang={languageCode}>
      <body>
        <RootProvider
          config={clientConfig}
          dateFNSKey={i18n.dateFNSKey}
          fallbackLang={config.i18n.fallbackLanguage}
          isNavOpen={isNavOpen}
          languageCode={languageCode}
          languageOptions={languageOptions}
          permissions={permissions}
          serverFunction={serverFunction}
          switchLanguageServerAction={switchLanguageServerAction}
          theme={theme}
          translations={i18n.translations}
          user={user}
        >
          {children}
        </RootProvider>
        <div id="portal" />
      </body>
    </html>
  )
}
