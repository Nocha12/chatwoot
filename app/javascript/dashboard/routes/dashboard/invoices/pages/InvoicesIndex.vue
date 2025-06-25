<script setup>
import { onMounted, ref, computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { debounce } from '@chatwoot/utils';
import { useUISettings } from 'dashboard/composables/useUISettings';

import ContactsListLayout from 'dashboard/components-next/Contacts/ContactsListLayout.vue';
import InvoicesList from 'dashboard/components-next/Invoices/Pages/InvoicesList.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

const DEFAULT_SORT_FIELD = 'created_at';
const DEBOUNCE_DELAY = 300;

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const { updateUISettings, uiSettings } = useUISettings();

const invoices = useMapGetter('invoices/getInvoicesList');
const uiFlags = useMapGetter('invoices/getUIFlags');
const meta = useMapGetter('invoices/getMeta');

const searchQuery = computed(() => route.query?.search);
const searchValue = ref(searchQuery.value || '');
const pageNumber = computed(() => Number(route.query?.page) || 1);

const parseSortSettings = (sortString = '') => {
  const hasDescending = sortString.startsWith('-');
  const sortField = hasDescending ? sortString.slice(1) : sortString;
  return {
    sort: sortField || DEFAULT_SORT_FIELD,
    order: hasDescending ? '-' : '',
  };
};

const { invoices_sort_by: invoicesSortBy = '' } = uiSettings.value ?? {};
const { sort: initialSort, order: initialOrder } = parseSortSettings(invoicesSortBy);

const sortState = reactive({
  activeSort: initialSort,
  activeOrdering: initialOrder,
});

const isFetchingList = computed(() => uiFlags.value.isFetching);
const currentPage = computed(() => Number(meta.value?.currentPage));
const totalItems = computed(() => meta.value?.count);
const hasInvoices = computed(() => invoices.value.length > 0);

const headerTitle = computed(() =>
  searchQuery.value
    ? t('INVOICES_LAYOUT.HEADER.SEARCH_TITLE')
    : t('INVOICES_LAYOUT.HEADER.TITLE')
);

const updatePageParam = (page, search = '') => {
  const query = {
    ...route.query,
    page: page.toString(),
    ...(search ? { search } : {}),
  };

  if (!search) {
    delete query.search;
  }

  router.replace({ query });
};

const buildSortAttr = () => `${sortState.activeOrdering}${sortState.activeSort}`;

const fetchInvoices = async (page = 1) => {
  await store.dispatch('invoices/get', { page, sortAttr: buildSortAttr() });
  updatePageParam(page);
};

const searchInvoices = debounce(async (value, page = 1) => {
  searchValue.value = value;

  if (!value) {
    updatePageParam(page);
    await fetchInvoices(page);
    return;
  }

  updatePageParam(page, value);
  await store.dispatch('invoices/search', {
    page,
    sortAttr: buildSortAttr(),
    search: encodeURIComponent(value),
  });
}, DEBOUNCE_DELAY);

const handleSort = async ({ sort, order }) => {
  Object.assign(sortState, { activeSort: sort, activeOrdering: order });

  await updateUISettings({ invoices_sort_by: buildSortAttr() });

  if (searchQuery.value) {
    await searchInvoices(searchValue.value);
    return;
  }

  await fetchInvoices();
};

watch(searchQuery, value => {
  if (isFetchingList.value) return;
  searchValue.value = value || '';
  if (value === undefined) {
    fetchInvoices();
  }
});

onMounted(async () => {
  if (searchQuery.value) {
    await searchInvoices(searchQuery.value, pageNumber.value);
    return;
  }
  await fetchInvoices(pageNumber.value);
});
</script>

<template>
  <div
    class="flex flex-col justify-between flex-1 h-full m-0 overflow-auto bg-n-background"
  >
    <ContactsListLayout
      :search-value="searchValue"
      :header-title="headerTitle"
      :current-page="currentPage"
      :total-items="totalItems"
      :show-pagination-footer="!isFetchingList && hasInvoices"
      :active-sort="sortState.activeSort"
      :active-ordering="sortState.activeOrdering"
      :is-fetching-list="isFetchingList"
      @update:current-page="fetchInvoices"
      @search="searchInvoices"
      @update:sort="handleSort"
    >
      <div
        v-if="isFetchingList"
        class="flex items-center justify-center py-10 text-n-slate-11"
      >
        <Spinner />
      </div>

      <template v-else>
        <div
          v-if="!hasInvoices"
          class="flex items-center justify-center py-10"
        >
          <span class="text-base text-n-slate-11">
            {{
              searchQuery
                ? t('INVOICES_LAYOUT.EMPTY_STATE.SEARCH_EMPTY_STATE_TITLE')
                : t('INVOICES_LAYOUT.EMPTY_STATE.LIST_EMPTY_STATE_TITLE')
            }}
          </span>
        </div>

        <InvoicesList v-else :invoices="invoices" />
      </template>
    </ContactsListLayout>
  </div>
</template>
