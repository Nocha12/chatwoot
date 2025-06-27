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

import { read, utils } from 'xlsx';

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
const { sort: initialSort, order: initialOrder } =
  parseSortSettings(invoicesSortBy);

const sortState = reactive({
  activeSort: initialSort,
  activeOrdering: initialOrder,
});
const excelInvoices = ref([]);

const isFetchingList = computed(() => uiFlags.value.isFetching);
const currentPage = computed(() => Number(meta.value?.currentPage));
const totalItems = computed(() => meta.value?.count);
const hasInvoices = computed(
  () => invoices.value.length > 0 || excelInvoices.value.length > 0
);

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

const buildSortAttr = () =>
  `${sortState.activeOrdering}${sortState.activeSort}`;

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

const handleFileChange = async event => {
  const file = event.target.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();
  const workbook = read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[workbook.SheetNames.length - 1];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return;
  }

  const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
  if (jsonData.length > 0) {
    const headers = jsonData[1];
    const rows = jsonData.slice(2);
    // Excel 데이터를 Invoice 형태로 변환
    const convertedInvoices = rows.map((row, index) => {
      const details = {};
      headers.forEach((header, headerIndex) => {
        if (header && row[headerIndex] !== undefined) {
          details[header] = row[headerIndex];
        }
      });

      return {
        id: index + 1,
        invoiceNumber: row[0] || `INV-${String(index + 1).padStart(3, '0')}`,
        total: row[1] || '',
        status: row[2] || '대기중',
        details,
      };
    });

    excelInvoices.value = convertedInvoices;
  }
};
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
      <input type="file" accept=".xlsx,.xls" @change="handleFileChange" />
      <div
        v-if="isFetchingList"
        class="flex items-center justify-center py-10 text-n-slate-11"
      >
        <Spinner />
      </div>

      <template v-else>
        <div v-if="!hasInvoices" class="flex items-center justify-center py-10">
          <span class="text-base text-n-slate-11">
            {{
              searchQuery
                ? t('INVOICES_LAYOUT.EMPTY_STATE.SEARCH_EMPTY_STATE_TITLE')
                : t('INVOICES_LAYOUT.EMPTY_STATE.LIST_EMPTY_STATE_TITLE')
            }}
          </span>
        </div>

        <InvoicesList
          v-else
          :invoices="excelInvoices.length > 0 ? excelInvoices : invoices"
        />
      </template>
    </ContactsListLayout>
  </div>
</template>
