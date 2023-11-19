// Util functions part
var groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key].trim()] = rv[x[key].trim()] || []).push(x);
    return rv;
  }, {});
};
function extractTimestampFromString(inputString) {
  var regex = /\/Date\((\d+)\)\//;
  var match = regex.exec(inputString);
  if (match && match[1]) return match[1];
  return null;
}
function extractValueFromQueryString(inputString) {
  var regex = /v=([^&]+)/;
  var match = regex.exec(inputString);
  if (match && match[1]) return match[1];
  else return 0;
}
function getTimestampServerCache() {
  var scriptElements = document.getElementsByTagName('script');
  for (var i = 0; i < scriptElements.length; i++) {
    var scriptSrc = scriptElements[i].getAttribute('src');
    if (scriptSrc && scriptSrc.indexOf('header.menu.vue') > -1)
      return extractValueFromQueryString(scriptSrc);
  }
  return 0;
}
// Vue App and Components part
const { createApp, ref, onMounted, computed, onBeforeMount } = Vue;
const SpanArrow = {
  template: '<span class="arrow-down-submenu">▼</span>',
};
const DivArrow = {
  template: '<div class="arrow-down"></div>',
};
const TextArrow = {
  template: '▼',
};
const Arrow = {
  props: ['type'],
  components: {
    SpanArrow,
    DivArrow,
    TextArrow,
  },
  computed: {
    getArrowComponent() {
      switch (this.type) {
        case 'span':
          return SpanArrow;
        case 'div':
          return DivArrow;
        case 'text':
          return TextArrow;
      }
    },
  },
  template: `
    <component :is="getArrowComponent"></component>
  `,
};
const ImageItem = {
  props: {
    className: {
      type: String,
      required: false,
    },
    cacheVersion: {
      type: Number,
      required: false,
    },
    imageData: {
      type: Object,
      required: true,
    },
  },
  computed: {
    src() {
      let staticImageHost =
        localStorage.getItem('cdnImageHost') || 'https://imgtest.playliga.com';
      var dbTimestamp = +extractTimestampFromString(
        this.imageData.HeaderLastUpdatedTime
      );
      var serverTimeStamp = +this.cacheVersion;
      var latestTimestamp =
        dbTimestamp > serverTimeStamp ? dbTimestamp : serverTimeStamp;
      let srcImage = `${staticImageHost}/headergames/${this.imageData.CTId}/MenuIcon_${this.imageData.GameType}.${this.imageData.ImageType}?v=${latestTimestamp}`;
      return srcImage;
    },
  },
  template: `<img :class="className" :src="src" :alt="imageData.GameMenuDisplayName" :title="imageData.GameMenuDisplayName" />`,
};
const MenuItem = {
  props: [
    'name',
    'className',
    'href',
    'title',
    'target',
    'onclickHandler',
    'hasSubMenu',
    'isGuest',
  ],
  computed: {
    formattedClass: () =>
      `${this.className ? this.className : ''} _${this.name}_game`,
  },
  template: `<a :title="name" :href="href" :class="formattedClass" :title="title">
                <slot name="image"></slot>
                <slot></slot>
                <slot name="arrow"></slot>
                <slot v-if="hasSubMenu === true" name="submenu"></slot>
            </a>`,
};
const SubMenuContainer = {
  props: ['name'],
  computed: {
    id: () => 'sub-menu-' + this.name,
  },
  template: `
                <div :id="id" class="sub-menu">
                    <div class="main_width">
                    <ul class="gameNav">
                        <slot></slot>
                    </ul>
                    </div>
                </div>
            `,
};
const SubMenuItem = {
  props: ['text', 'href', 'target', 'onclickHandler', 'isGuest', 'src'],
  computed: {
    href() {
      return this.value;
    },
  },
  template: `
                <li>
                    <a style="background:none!important" :href=href>
                        <img :alt="text" :title="text" :src=src />
                        {{text}}
                    </a>
                </li>
            `,
};
const ImageMenuItem = {
  props: [
    'text',
    'href',
    'icon',
    'className',
    'src',
    'arrow',
    'isIcon',
    'version',
  ],
  components: {
    SpanArrow,
    DivArrow,
  },
  methods: {
    getArrowComponent() {
      switch (this.arrow) {
        case 'span':
          return SpanArrow;
        case 'div':
          return DivArrow;
        default:
          return null;
      }
    },
  },
  template: `
    <a :href="href" :class="className">
        <img :class="className" :src="formattedSrc" :alt="text" :title="text" />
        {{text}}
        <component :is="getArrowComponent()" v-if="arrow !== 'none'"></component>
    </a>
  `,
};

function createMenu() {
  return createApp({
    methods: {
      genScriptSubMenu() {},
    },
    setup() {
      let data = ref({});
      let array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      let dataFetched = ref(false);
      let appId = ref('');
      let message = ref('message');
      let cacheVersion = ref(0);
      const fetchMenuData = (callback) => {
        const apiUrl = 'public/GameGen.json?cmd=GetHeaderMenuGames';
        $.ajax({
          url: apiUrl,
          method: 'GET',
          success: function (response) {
            if (response && response.success) {
              let menuMap = groupBy(response.menus, 'GameType');
              localStorage.setItem('menuMap', JSON.stringify(menuMap));
              Object.assign(data.value, menuMap);
              dataFetched.value = true;
              console.log(JSON.stringify(menuMap));
              if (typeof callback === 'function') {
                callback(response);
              }
            } else {
              alert(JSON.stringify(response));
            }
          },
          error: function (error) {
            console.error('Error fetching data:', error);
          },
        });
      };
      const genStyleSubMenu = (menuMap, mainMenuId) => {
        let tagParentSubMenu = document
          .getElementById(mainMenuId)
          .getAttribute('tag-parent-sub-menu');
        let htmlStyles = ``;
        for (const gameType in menuMap) {
          htmlStyles += `${tagParentSubMenu}._${gameType.toLowerCase()}_game:hover > #sub-menu-${gameType.toLowerCase()} {display: inline-block}\r\n`;
        }
        console.log(htmlStyles);
        const styleElement = document.createElement('style');
        styleElement.textContent = htmlStyles;
        document.body.appendChild(styleElement);
      };

      onMounted(() => {
        cacheVersion.value = getTimestampServerCache();
        console.log(cacheVersion.value);
        fetchMenuData((response) => {
          console.log('Menu data fetched:', response);
          genStyleSubMenu(data.value, appId.value);
        });
      });
      onBeforeMount(() => {
        appId.value = mountEl.dataset.id;
        console.log(mountEl.dataset.id);
      });
      const computedProps = {};
      return {
        menus: data.value,
        ...computedProps,
        fetchMenuData,
        dataFetched,
        array,
        genStyleSubMenu,
        message,
      };
    },
  });
}
var menu = createMenu();
menu.component('image-item', ImageItem);
menu.component('arrow', Arrow);
menu.component('menu-item', MenuItem);
menu.component('submenu-container', SubMenuContainer);
menu.component('submenu', SubMenuItem);
