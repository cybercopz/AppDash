import {
  createLabelColumn,
  createMetricColumn,
  createHeader,
  createHealthColumn,
} from './createColumn'
import getMetricFromShortcut from './getMetricFromShortcut'
import flattenAppElements, { flattenSEs } from './flattenAppElements'

const LABELS_WIDTH = 300
const METRICS_WIDTH = 200
const HEALTH_WIDTH = 50
const LABEL_ENTITIES = ['application', 'bt', 'tier', 'node', 'backend', 'se']

// TODO: each of the different widget types should probably be split out into their own files
export default ({ selects, selectIndex, data, x }) => {
  let width
  const select = selects[selectIndex].value
  const scopingSelect = selects[0].value

  // create the header
  const header = createHeader({
    labelText: selects[selectIndex].as || getMetricFromShortcut(select).metric,
    x,
  })

  // create a label column
  if (LABEL_ENTITIES.includes(select)) {
    width = LABELS_WIDTH
    let labelTexts = []
    if (select === 'bt') {
      const bts = flattenAppElements({
        applications: data.applications,
        key: 'bts',
      })
      labelTexts = bts.map(({ data: { name } }) => name)
    } else if (select === 'tier') {
      const tiers = flattenAppElements({
        applications: data.applications,
        key: 'tiers',
      })
      labelTexts = tiers.map(({ data: { name } }) => name)
    } else if (select === 'node') {
      const elements = flattenAppElements({
        applications: data.applications,
        key: 'nodes',
      })
      labelTexts = elements.map(({ data: { name } }) => name)
    } else if (select === 'se') {
      const ses = flattenSEs({
        applications: data.applications,
        key: 'ses',
      })
      labelTexts = ses.map(({ data: name }) => name)
    } else if (select === 'application') {
      labelTexts = data.applications.map(({ name }) => name)
    }
    return {
      nextX: x + width,
      column: [
        { ...header, width },
        ...createLabelColumn({ labelTexts, x, width }),
      ],
    }
  }

  // create a health column
  if (select === 'health') {
    width = HEALTH_WIDTH
    let healthDatas = []
    if (scopingSelect === 'bt') {
      const bts = flattenAppElements({
        applications: data.applications,
        key: 'bts',
      })
      healthDatas = bts.map(
        ({
          applicationName,
          data: { internalName, tier, entryPointType },
        }) => ({
          applicationName,
          entityName: internalName,
          scopingEntityName: tier,
          subtype: entryPointType,
        }),
      )
    } else if (scopingSelect === 'tier') {
      const tiers = flattenAppElements({
        applications: data.applications,
        key: 'tiers',
      })
      healthDatas = tiers.map(({ applicationName, data: { name } }) => ({
        applicationName,
        entityName: name,
        scopingEntityName: null,
        subtype: null,
      }))
    } else if (scopingSelect === 'node') {
      const elements = flattenAppElements({
        applications: data.applications,
        key: 'nodes',
      })
      healthDatas = elements.map(
        ({ applicationName, data: { name, tier } }) => ({
          applicationName,
          entityName: name,
          scopingEntityName: tier,
          subtype: null,
        }),
      )
    } else if (scopingSelect === 'application') {
      healthDatas = data.applications.map(({ name }) => ({
        applicationName: name,
        entityName: name,
      }))
    }
    return {
      nextX: x + width,
      column: [
        { ...header, width },
        ...createHealthColumn({ healthDatas, type: scopingSelect, x, width }),
      ],
    }
  }

  // otherwise, create a metric column
  const { metric } = getMetricFromShortcut(select)

  width = METRICS_WIDTH
  let metricWidgetData
  if (scopingSelect === 'bt') {
    const bts = flattenAppElements({
      applications: data.applications,
      key: 'bts',
    })
    metricWidgetData = bts.map(
      ({ applicationName, data: { internalName, tier } }) => ({
        applicationName,
        metricPath: `Business Transaction Performance|Business Transactions|${tier}|${internalName}|${metric}`,
        entityName: tier,
      }),
    )
  } else if (scopingSelect === 'tier') {
    const tiers = flattenAppElements({
      applications: data.applications,
      key: 'tiers',
    })
    metricWidgetData = tiers.map(({ applicationName, data: { name } }) => ({
      applicationName,
      metricPath: `Overall Application Performance|${name}|${metric}`,
      entityName: name,
    }))
  } else if (scopingSelect === 'node') {
    const elements = flattenAppElements({
      applications: data.applications,
      key: 'nodes',
    })
    metricWidgetData = elements.map(
      ({ applicationName, data: { tier, name } }) => ({
        applicationName,
        metricPath: `Overall Application Performance|${tier}|Individual Nodes|${name}|${metric}`,
        entityName: tier,
      }),
    )
  } else if (scopingSelect === 'se') {
    const ses = flattenSEs({
      applications: data.applications,
      key: 'ses',
    })
    metricWidgetData = ses.map(({ applicationName, tier, data: seName }) => ({
      applicationName,
      metricPath: `Service Endpoints|${tier}|${seName}|${metric}`,
      entityName: tier,
    }))
  } else if (scopingSelect === 'application') {
    const { applications } = data
    metricWidgetData = applications.map(({ name }) => ({
      applicationName: name,
      metricPath: `Overall Application Performance|${metric}`,
      entityName: name,
      entityType: 'APPLICATION',
    }))
  }

  return {
    nextX: x + width,
    column: [
      { ...header, width: METRICS_WIDTH, textAlign: 'RIGHT' },
      ...createMetricColumn({
        metricWidgetData,
        x,
        formatString: getMetricFromShortcut(select).formatString,
        width,
      }),
    ],
  }
}
