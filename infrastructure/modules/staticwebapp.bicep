param suffix string
param tags object

@description('Static Web Apps is not offered in every region, so this is its own parameter, not the workload region.')
param location string

@description('Resource id of the App Service that /api is linked to.')
param backendResourceId string

@description('Region of that App Service.')
param backendRegion string

// Standard, because a linked backend is not available on the Free plan.
resource site 'Microsoft.Web/staticSites@2023-12-01' = {
  name: 'stapp-${suffix}'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

// Same-origin /api: the host forwards /api to the App Service, so the browser makes no cross-origin call and the
// Content-Security-Policy stays default-src 'self'.
resource backend 'Microsoft.Web/staticSites/linkedBackends@2023-12-01' = {
  parent: site
  name: 'api'
  properties: {
    backendResourceId: backendResourceId
    region: backendRegion
  }
}

output siteName string = site.name
output hostName string = site.properties.defaultHostname
