<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import ContactListHeaderWrapper from 'dashboard/components-next/Contacts/ContactsHeader/ContactListHeaderWrapper.vue';
import ContactsActiveFiltersPreview from 'dashboard/components-next/Contacts/ContactsHeader/components/ContactsActiveFiltersPreview.vue';

defineProps({
  searchValue: { type: String, default: '' },
  headerTitle: { type: String, default: '' },
  activeSort: { type: String, default: '' },
  activeOrdering: { type: String, default: '' },
  activeSegment: { type: Object, default: null },
  segmentsId: { type: [String, Number], default: 0 },
  hasAppliedFilters: { type: Boolean, default: false },
  isFetchingList: { type: Boolean, default: false },
});

const emit = defineEmits([
  'update:sort',
  'search',
  'applyFilter',
  'clearFilters',
]);

const route = useRoute();

const contactListHeaderWrapper = ref(null);

const isNotSegmentView = computed(() => {
  return route.name !== 'contacts_dashboard_segments_index';
});

const isLabelView = computed(
  () => route.name === 'contacts_dashboard_labels_index'
);

const openFilter = () => {
  contactListHeaderWrapper.value?.onToggleFilters();
};
</script>

<template>
  <section
    class="flex w-full h-full gap-4 overflow-hidden justify-evenly bg-n-background"
  >
    <div class="flex flex-col w-full h-full transition-all duration-300">
      <ContactListHeaderWrapper
        ref="contactListHeaderWrapper"
        :show-search="isNotSegmentView"
        :search-value="searchValue"
        :active-sort="activeSort"
        :active-ordering="activeOrdering"
        :header-title="headerTitle"
        :active-segment="activeSegment"
        :segments-id="segmentsId"
        :has-applied-filters="hasAppliedFilters"
        :is-label-view="isLabelView"
        @update:sort="emit('update:sort', $event)"
        @search="emit('search', $event)"
        @apply-filter="emit('applyFilter', $event)"
        @clear-filters="emit('clearFilters')"
      />
      <main class="flex-1 overflow-y-auto">
        <div class="w-full mx-auto max-w-[60rem]">
          <ContactsActiveFiltersPreview
            v-if="
              (hasAppliedFilters || !isNotSegmentView) &&
              !isFetchingList &&
              !isLabelView
            "
            :active-segment="activeSegment"
            @clear-filters="emit('clearFilters')"
            @open-filter="openFilter"
          />
          <slot name="default" />
        </div>
      </main>
    </div>
  </section>
</template>
