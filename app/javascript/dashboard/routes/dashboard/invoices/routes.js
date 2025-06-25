import { frontendURL } from '../../../helper/URLHelper';
import InvoicesIndex from './pages/InvoicesIndex.vue';

const commonMeta = {
  permissions: ['administrator', 'agent'],
};

export const routes = [
  {
    path: frontendURL('accounts/:accountId/invoices'),
    component: InvoicesIndex,
    meta: commonMeta,
    children: [
      {
        path: '',
        name: 'invoices_dashboard_index',
        component: InvoicesIndex,
        meta: commonMeta,
      },
    ],
  },
];
