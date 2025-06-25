import camelcaseKeys from 'camelcase-keys';

export const getters = {
  getInvoices($state) {
    return $state.sortOrder.map(id => $state.records[id]);
  },
  getInvoicesList($state) {
    const invoices = $state.sortOrder.map(id => $state.records[id]);
    return camelcaseKeys(invoices, { deep: true });
  },
  getUIFlags($state) {
    return $state.uiFlags;
  },
  getInvoice: $state => id => {
    const invoice = $state.records[id];
    return invoice || {};
  },
  getMeta: $state => {
    return $state.meta;
  },
};
