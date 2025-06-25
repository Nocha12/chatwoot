import types from '../../mutation-types';

export const mutations = {
  [types.SET_INVOICE_UI_FLAG]($state, data) {
    $state.uiFlags = {
      ...$state.uiFlags,
      ...data,
    };
  },

  [types.CLEAR_INVOICES]: $state => {
    $state.records = {};
    $state.sortOrder = [];
  },

  [types.SET_INVOICE_META]: ($state, data) => {
    const { count, current_page: currentPage } = data;
    $state.meta.count = count;
    $state.meta.currentPage = currentPage;
  },

  [types.SET_INVOICES]: ($state, data) => {
    const sortOrder = data.map(invoice => {
      $state.records[invoice.id] = {
        ...($state.records[invoice.id] || {}),
        ...invoice,
      };
      return invoice.id;
    });
    $state.sortOrder = sortOrder;
  },

  [types.SET_INVOICE_ITEM]: ($state, data) => {
    $state.records[data.id] = {
      ...($state.records[data.id] || {}),
      ...data,
    };
    if (!$state.sortOrder.includes(data.id)) {
      $state.sortOrder.push(data.id);
    }
  },
};
