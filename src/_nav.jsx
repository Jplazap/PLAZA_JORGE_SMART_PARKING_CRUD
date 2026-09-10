import React from 'react'

import CIcon from '@coreui/icons-react'

import {
  cilCamera,
  cilCarAlt,
  cilGarage,
  cilSpeedometer,
} from '@coreui/icons'

import {
  CNavItem,
  CNavTitle,
} from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: (
      <CIcon
        icon={cilSpeedometer}
        customClassName="nav-icon"
      />
    ),
  },

  {
    component: CNavTitle,
    name: 'Parqueadero',
  },

  {
    component: CNavItem,
    name: 'Vehículos y propietarios',
    to: '/parqueadero/vehiculos',
    icon: (
      <CIcon
        icon={cilCarAlt}
        customClassName="nav-icon"
      />
    ),
  },

  {
    component: CNavItem,
    name: 'Monitoreo de entrada',
    to: '/parqueadero/monitoreo-entrada',
    icon: (
      <CIcon
        icon={cilCamera}
        customClassName="nav-icon"
      />
    ),
  },

  {
    component: CNavItem,
    name: 'Puestos',
    to: '/parqueadero/puestos',
    icon: (
      <CIcon
        icon={cilGarage}
        customClassName="nav-icon"
      />
    ),
  },
]

export default _nav
