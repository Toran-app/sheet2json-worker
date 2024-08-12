import { parse } from 'papaparse'
import camelCase from 'lodash.camelcase'
// import mapKeys from 'lodash.mapkeys'

import transformRows from './transform'

// addEventListener('fetch', event => {
//   event.respondWith(generateJSON())
// })

function parseCSV(csvString, config) {
  return new Promise((resolve, reject) => {
    parse(csvString, {
      ...config,
      complete: ({ data }) => resolve(data),
      error: reject,
    })
  })
};

async function generateJSON(env) {
  const url = `https://docs.google.com/spreadsheets/d/${env.DOC_ID}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(env.SHEET_NAME)}`

  const resp = await fetch(url, {
    cf: {
      cacheTtl: Number(env.TTL),  // seconds
    },
  })
  const csv = await resp.text()

  const rows = await parseCSV(csv, {
    header: true,
    transformHeader: camelCase,
  })
  const transformedRows = transformRows(rows)

  let response = new Response(JSON.stringify(transformedRows), {
    headers: {
      'Cache-Control': `max-age=${env.TTL}`,
      'Content-Type': 'application/json',
    },
  })
  return response
}

export default {
  async fetch(request, env, ctx) {
    return await generateJSON(env)
  }
}