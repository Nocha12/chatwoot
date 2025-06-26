import { frontendURL } from '../../../../helper/URLHelper';

const invoices = accountId => ({
  parentNav: 'invoices',
  routes: ['invoices_dashboard_index'],
  menuItems: [
    {
      icon: 'document-outline',
      label: 'INVOICES',
      hasSubMenu: false,
      toState: frontendURL(`accounts/${accountId}/invoices`),
      toStateName: 'invoices_dashboard_index',
    },
  ],
});

export default invoices;
