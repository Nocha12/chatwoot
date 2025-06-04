<script>
import Icon from 'dashboard/components-next/icon/Icon.vue';

export default {
  components: { Icon },
  props: {
    socialProfiles: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      socialMediaLinks: [
        { key: 'facebook', icon: 'i-ri-facebook-circle-fill', link: 'https://facebook.com/' },
        { key: 'twitter', icon: 'i-ri-twitter-x-fill', link: 'https://twitter.com/' },
        { key: 'linkedin', icon: 'i-ri-linkedin-box-fill', link: 'https://linkedin.com/' },
        { key: 'github', icon: 'i-ri-github-fill', link: 'https://github.com/' },
        { key: 'instagram', icon: 'i-ri-instagram-line', link: 'https://instagram.com/' },
        { key: 'tiktok', icon: 'i-ri-tiktok-fill', link: 'https://tiktok.com/@' },
        { key: 'telegram', icon: 'i-ri-telegram-fill', link: 'https://t.me/' },
      ],
    };
  },
  computed: {
    availableProfiles() {
      return this.socialMediaLinks.filter(
        mediaLink => !!this.socialProfiles[mediaLink.key]
      );
    },
  },
};
</script>

<!-- eslint-disable-next-line vue/no-root-v-if -->
<template>
  <div v-if="availableProfiles.length" class="flex items-end gap-3 mx-0 my-2">
    <a
      v-for="profile in availableProfiles"
      :key="profile.key"
      :href="`${profile.link}${socialProfiles[profile.key]}`"
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      <Icon
        :icon="profile.icon"
        class="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      />
    </a>
  </div>
</template>
