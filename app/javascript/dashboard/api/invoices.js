/* global axios */
import ApiClient from './ApiClient';

export const buildInvoiceParams = (page, sortAttr, search) => {
  let params = `page=${page}&sort=${sortAttr}`;
  if (search) {
    params = `${params}&q=${search}`;
  }
  return params;
};

class InvoiceAPI extends ApiClient {
  constructor() {
    super('invoices', { accountScoped: true });
  }

  get(page, sortAttr = 'created_at') {
    const requestURL = `${this.url}?${buildInvoiceParams(page, sortAttr)}`;
    return axios.get(requestURL);
  }

  show(id) {
    return axios.get(`${this.url}/${id}`);
  }

  search(search = '', page = 1, sortAttr = 'created_at') {
    const requestURL = `${this.url}/search?${buildInvoiceParams(
      page,
      sortAttr,
      search
    )}`;
    return axios.get(requestURL);
  }
}

export default new InvoiceAPI();
