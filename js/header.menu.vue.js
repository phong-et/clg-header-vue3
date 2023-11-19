var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key].trim()] = rv[x[key].trim()] || []).push(x);
        return rv;
    }, {});
}
const { createApp, ref, onMounted, computed, onBeforeMount } = Vue;
const SpanArrow = {
    template: '<span class="arrow-down-submenu">▼</span>'
};
const DivArrow = {
    template: '<div class="arrow-down"></div>'
};
const TextArrow = {
    template: '▼'
};
const Arrow = {
    props: ['type'],
    components: {
        SpanArrow,
        DivArrow,
        TextArrow
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
        }
    },
    template: `
                <component :is="getArrowComponent"></component>
            `,
};
const StyleItem = {
    props: ['tag', 'name'],
    computed: {
        subMenuId() {
            return 'sub-menu-' + this.name;
        },
        menuClass() {
            return this.name + '-game';
        },
    },
    template: `<style>
                {{tag}}.{{menuClass}}:hover > #{{subMenuId}} {display: inline-block}
            </style>`,
};
const ImageItem = {
    props: ['name', 'src', 'className', 'version'],
    computed: {
        formattedSrc() {
            return this.src + '?v=' + this.version;
        },
    },
    template: `<img :class="className" :src="formattedSrc" :alt="name" :title="name" />`,
};
const MenuItem = {
    props: ['name', 'className', 'href', 'target', 'onclickHandler', 'hasSubMenu', 'isGuest'],
    computed: {
        formattedClass: () => `${this.className} _${this.name}-game`
    },
    template: `<a :title="name" :href="href" :class="formattedClass">
                <slot name="image-item"></slot>
                {{name}}
                <slot name="arrow"></slot>
                <slot name="style-item"></slot>
            </a>`,
};
const SubMenuContainer = {
    props: ['name'],
    computed: {
        id() {
            return "sub-menu-" + this.name;
        }
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
            return this.value
        }
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
    props: ['text', 'href', 'icon', 'className', 'src', 'arrow', 'isIcon', 'version'],
    components: {
        SpanArrow,
        DivArrow
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
            genScriptSubMenu() {

            }
        },
        setup() {
            let data = ref({});
            let array = [1, 2, 3, 4, 5, 6, 7, 8, 9]
            let dataFetched = ref(false);
            let appId = ref("");
            const fetchMenuData = (callback) => {
                const apiUrl = 'public/GameGen.ashx?cmd=GetHeaderMenuGames';
                $.ajax({
                    url: apiUrl,
                    method: 'GET',
                    success: function (response) {
                        if (response && response.success) {
                            let menuMap = groupBy(response.menus, 'GameType');
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
                        console.error("Error fetching data:", error);
                    }
                });
            };
            const genStyleSubMenu = (menuMap, mainMenuId) => {
                let tagParentSubMenu = document.getElementById(mainMenuId).getAttribute("tag-parent-sub-menu");
                let htmlStyles = ``
                for (const gameType in menuMap) {
                    htmlStyles += `${tagParentSubMenu}._${gameType.toLowerCase()}_game:hover > #sub-menu-${gameType.toLowerCase()} {display: inline-block}\r\n`
                }
                console.log(htmlStyles)
                const styleElement = document.createElement('style');
                styleElement.textContent = htmlStyles;
                document.body.appendChild(styleElement);
            };

            onMounted(() => {
                fetchMenuData((response) => {
                    console.log('Menu data fetched:', response);
                    genStyleSubMenu(data.value, appId.value)

                });

            });
            onBeforeMount(() => {
                appId.value = mountEl.dataset.id
                console.log(mountEl.dataset.id)
            });
            const computedProps = {

            }
            return {
                menus: data,
                ...computedProps,
                fetchMenuData,
                dataFetched,
                array,
                genStyleSubMenu
            };
        },
    })
};
var menu = createMenu();
menu.component('image-item', ImageItem);
menu.component('arrow', Arrow);
menu.component('style-item', StyleItem);
menu.component('menu-item', MenuItem);
menu.component('sub-menu-container', SubMenuContainer);
menu.component('sub-menu-item', SubMenuItem);