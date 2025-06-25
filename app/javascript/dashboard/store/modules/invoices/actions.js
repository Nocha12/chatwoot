import types from '../../mutation-types';
import InvoiceAPI from '../../../api/invoices';

export const actions = {
  get: async ({ commit }, { page = 1, sortAttr } = {}) => {
    commit(types.SET_INVOICE_UI_FLAG, { isFetching: true });
    try {
      const {
        data: { payload, meta },
      } = await InvoiceAPI.get(page, sortAttr);
      commit(types.CLEAR_INVOICES);
      commit(types.SET_INVOICES, payload);
      commit(types.SET_INVOICE_META, meta);
    } finally {
      commit(types.SET_INVOICE_UI_FLAG, { isFetching: false });
    }
  },

  search: async ({ commit }, { search, page = 1, sortAttr }) => {
    commit(types.SET_INVOICE_UI_FLAG, { isFetching: true });
    try {
      const {
        data: { payload, meta },
      } = await InvoiceAPI.search(search, page, sortAttr);
      commit(types.CLEAR_INVOICES);
      commit(types.SET_INVOICES, payload);
      commit(types.SET_INVOICE_META, meta);
    } finally {
      commit(types.SET_INVOICE_UI_FLAG, { isFetching: false });
    }
  },

  show: async ({ commit }, { id }) => {
    commit(types.SET_INVOICE_UI_FLAG, { isFetchingItem: true });
    try {
      const { data } = await InvoiceAPI.show(id);
      commit(types.SET_INVOICE_ITEM, data);
    } finally {
      commit(types.SET_INVOICE_UI_FLAG, { isFetchingItem: false });
    }
  },
};
