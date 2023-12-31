﻿// Util functions part
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
let addPrefix = (variableName) =>
  isNaN(variableName.substring(0, 1)) ? '' : '_';
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
const DownArrow = {
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
    isSubmenu: {
      type: Boolean,
      required: false,
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
      let srcImage = '';
      if (!this.isSubmenu)
        srcImage = `${staticImageHost}/headergames/${this.imageData.CTId}/MenuIcon_${this.imageData.GameType}.${this.imageData.ImageType}?v=${latestTimestamp}`;
      else
        srcImage = `${staticImageHost}/headergames/SubMenuIcon_${this.imageData.HGameId}_${this.imageData.GameName}.${this.imageData.ImageType}?v=${latestTimestamp}`;
      return srcImage;
    },
  },
  template: `<img :class="className" :src="src" :alt="imageData.GameMenuDisplayName"/>`,
};
const MenuItem = {
    props: {
        name: String,
        className: String,
        href: String,
        target: String,
        onclickHandler: Function,
        hasSubMenu: Boolean,
        isGuest: Boolean,
    },
    computed: {
        formattedClass() {
            let prefix = addPrefix(this.name);
            return `${this.className ? this.className : ''
                } ${prefix}${this.name.toLowerCase()}-game`;
        },
    },
    template: `<a :href="href" :class="formattedClass">
                <slot></slot>
            </a>`,
};
const SubMenuContainer = {
    props: ['name', 'className'],
    computed: {
        id() {
            return 'sub-menu-' + this.name.toLowerCase();
        },
        formattedClass() {
            return `sub-menu ${this.className || ''}`;
        },
    },
    template: `
      <div :id="id" :class="formattedClass">
          <div class="main_width">
          <ul class="gameNav">
              <slot></slot>
          </ul>
          </div>
      </div>
  `,
};
const SubMenuItem = {
    props: ['name', 'type', 'target', 'isGuest', 'username'],
    computed: {
        href() {
            if (this.isGuest) return '#';
            switch (this.type.toLowerCase()) {
                case 'afbsb':
                    switch (this.name.toLowerCase()) {
                        case 'liga sb':
                            return 'Ajax/LIGASB_TSW.ashx?u=' + this.username;
                        case 'sport':
                            return '_View/RMOdds1.aspx';
                        default:
                            return '#';
                    }
            }
        },
        formattedTarget() {
            return this.href == '#' ? '' : 'fraMain';
        },
    },
    template: `
    <li>
        <a style="background:none!important" :href="href" :target="formattedTarget">
            <slot></slot>
            {{name}}
        </a>
    </li>
  `,
};

function createMenu() {
  return createApp({
    methods: {
      genScriptSubMenu() {},
    },
    setup() {
      let data = ref({});
      let dataFetched = ref(false);
      let appId = ref('');
      let cacheVersion = ref(0);
      let isGuest = ref(true);
      const fetchMenuData = (callback) => {
        const apiUrl = 'public/GameGen.json?cmd=GetHeaderMenuGames';
        $.ajax({
          url: apiUrl,
          method: 'GET',
          success: function (response) {
            if (response && response.success) {
              let menuMap = groupBy(response.menus, 'GameType');
              if (isGuest) delete menuMap['ALLGAMES'];
              localStorage.setItem('menuMap', JSON.stringify(menuMap));
              Object.assign(data.value, menuMap);
              dataFetched.value = true;
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
          htmlStyles += `${tagParentSubMenu}.${addPrefix(
            gameType
          )}${gameType.toLowerCase()}-game:hover > #sub-menu-${gameType.toLowerCase()} {display: inline-block}\r\n`;
        }
        //console.log(htmlStyles);
        const styleElement = document.createElement('style');
        styleElement.textContent = htmlStyles;
        document.body.appendChild(styleElement);
      };

      onMounted(() => {
        
        Object.assign(data.value, JSON.parse(localStorage.getItem('menuMap')));
        fetchMenuData((response) => {
          genStyleSubMenu(data.value, appId.value);
        });
      });
      onBeforeMount(() => {
        appId.value = mountEl.dataset.id;
        isGuest.value = mountEl.dataset.isGuest === 'true';
        cacheVersion.value = +getTimestampServerCache();
        //console.log(mountEl.dataset.id);
        //console.log(mountEl.dataset.isGuest);
      });
      const computedProps = {};
      return {
        menus: data.value,
        dataFetched,
        ...computedProps,
        cacheVersion,
        isGuest,
        fetchMenuData,
        genStyleSubMenu,
      };
    },
  });
}
var menu = createMenu();
menu.component('image-item', ImageItem);
menu.component('down-arrow', DownArrow);
menu.component('menu-item', MenuItem);
menu.component('submenu-container', SubMenuContainer);
menu.component('submenu-item', SubMenuItem);
