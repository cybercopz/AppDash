import _ from 'lodash'
import queryParser, { getApplicationsFromWheres } from './queryParser'
import { getApps, getBTs } from './getAppModel'
import getColumnFromSelect from './getColumnFromSelect'
import base from './widgetTemplates/base'
import createDashboard from './createDashboard'

export default async ({ query, dashboardName = 'dash-ql', config }) => {
  if (query === '') {
    return { msg: 'No query', type: 'warning' }
  }

  const {
    host,
    username,
    password,
    account = 'customer1',
    port = 80,
    https = true,
  } = config

  if (!host || !username || !password) {
    return {
      msg: 'Please add your controller info to Config first',
      type: 'warning',
    }
  }
  const baseURL = `${https ? 'https' : 'http'}://${host}/controller`
  const options = {
    url: `${baseURL}`,
    port,
    auth: {
      user: `${username}@${account}`,
      pass: password,
      sendImmediately: true,
    },
  }

  const { selects, wheres } = queryParser({ query })

  // TODO: maybe this should be a gather data method
  // TODO: only get bt info if in select
  const allApplications = await getApps({ options, baseURL })

  const { applicationNames, errorMsg } = getApplicationsFromWheres({
    wheres,
    allApplications,
  })

  if (errorMsg) {
    return { msg: errorMsg, type: 'error' }
  }

  const bt = await getBTs({ applicationNames, wheres, options, baseURL })

  const data = { bt }

  const widgets = selects.map((s, index) =>
    getColumnFromSelect({
      selects,
      selectIndex: index,
      data,
    }),
  )

  const dashObj = {
    ...base,
    widgetTemplates: _.flatten(widgets),
    name: dashboardName,
    width: 1200,
  }

  const msg = createDashboard({ dashObj, options, baseURL })
  return msg
}