@description('The environment name (dev, staging, prod)')
param environment string = 'dev'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the project')
param projectName string = 'revlr'

@description('The username for the AKS cluster admin')
param aksAdminUsername string = 'aksadmin'

// Variables for resource naming
var containerRegistryName = '${projectName}${environment}'
var aksClusterName = '${projectName}-${environment}-aks'
param shortenedEnvironment string = environment == 'Developement' ? 'dev' : environment == 'Production' ? 'prod' : environment == 'Staging' ? 'stg' : environment
param aksIdentityName string = 'aks-identity-${shortenedEnvironment}'
param aksNodeCount int = 2
param aksNodeSize string = 'Standard_A2_v2'

resource aksIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: aksIdentityName
  location: location
}

// Container Registry
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: true
  }
}

// AKS Cluster
resource aksCluster 'Microsoft.ContainerService/managedClusters@2023-01-01' = {
  name: aksClusterName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${aksIdentity.id}': {}
    }
  }
  properties: {
    agentPoolProfiles: [
      {
        name: 'nodepool1'
        count: aksNodeCount
        vmSize: aksNodeSize
        osType: 'Linux'
        mode: 'System'
      }
    ]
    dnsPrefix: 'revlr-${environment}'
    networkProfile: {
      networkPlugin: 'azure'
    }
  }
}

// Grant AKS access to ACR
// resource aksAcrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
//   name: guid(aksCluster.id, acr.id, 'acrpull')
//   scope: acr
//   properties: {
//     roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull role
//     principalId: aksCluster.properties.identityProfile.kubeletidentity.objectId
//     principalType: 'ServicePrincipal'
//   }
// }

// Outputs
output aksClusterName string = aksCluster.name
output acrLoginServer string = acr.properties.loginServer
output kubeConfig string = listClusterAdminCredential(aksCluster.id, aksCluster.apiVersion).kubeconfigs[0].value
